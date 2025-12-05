from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from database import get_db, ValidationRequest, ValidationResult, Token, EvidenceSignal, Address, AuditLog
from models import AdminConfirmInput, DashboardKPI, QueueItem
from scoring_engine import ScoringEngine
from token_service import TokenService
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/admin", tags=["admin"])

scoring_engine = ScoringEngine()
token_service = TokenService()


@router.get("/dashboard", response_model=DashboardKPI)
async def get_dashboard_kpis(db: Session = Depends(get_db)):
    """Get admin dashboard KPIs"""
    
    # Total validations
    total = db.query(ValidationRequest).count()
    
    # Pending validations
    pending = db.query(ValidationRequest).filter(
        ValidationRequest.status.in_(["queued", "processing"])
    ).count()
    
    # Average ACS
    avg_acs_result = db.query(func.avg(ValidationResult.acs)).scalar()
    avg_acs = round(avg_acs_result, 2) if avg_acs_result else 0.0
    
    # VL distribution
    vl_dist = {}
    for vl in ["VL0", "VL1", "VL2", "VL3"]:
        count = db.query(ValidationResult).filter(ValidationResult.vl == vl).count()
        vl_dist[vl] = count
    
    # Recent validations (last 24 hours)
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent = db.query(ValidationRequest).filter(
        ValidationRequest.created_at >= yesterday
    ).count()
    
    return DashboardKPI(
        total_validations=total,
        pending_validations=pending,
        avg_acs=avg_acs,
        vl_distribution=vl_dist,
        recent_validations=recent
    )


@router.get("/queue")
async def get_validation_queue(db: Session = Depends(get_db), limit: int = 50):
    """Get validation queue for admin review"""
    
    # Get recent validations
    requests = db.query(ValidationRequest).order_by(
        desc(ValidationRequest.created_at)
    ).limit(limit).all()
    
    queue = []
    for req in requests:
        result = db.query(ValidationResult).filter(ValidationResult.validation_request_id == req.id).first()
        address = db.query(Address).filter(Address.id == req.address_id).first()
        
        address_str = ""
        if address:
            address_str = f"{address.house_no}, {address.street}, {address.locality}, {address.city} - {address.pin}"
        
        queue.append({
            "request_id": req.id,
            "address": address_str,
            "status": req.status,
            "acs": result.acs if result else None,
            "vl": result.vl if result else None,
            "created_at": req.created_at.isoformat()
        })
    
    return {"queue": queue}


@router.post("/confirm")
async def admin_confirm_validation(confirm: AdminConfirmInput, db: Session = Depends(get_db)):
    """
    Admin confirms/overrides a validation
    Simulates postman confirmation or human review
    """
    
    # Get validation request
    validation_req = db.query(ValidationRequest).filter(
        ValidationRequest.id == confirm.request_id
    ).first()
    
    if not validation_req:
        raise HTTPException(status_code=404, detail="Validation request not found")
    
    # Get existing result
    result = db.query(ValidationResult).filter(
        ValidationResult.validation_request_id == confirm.request_id
    ).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Validation result not found")
    
    # Get address
    address = db.query(Address).filter(Address.id == validation_req.address_id).first()
    
    # Get evidence signals
    evidence_signals = db.query(EvidenceSignal).filter(
        EvidenceSignal.validation_request_id == confirm.request_id
    ).all()
    
    # Convert to dict format for scoring engine
    evidence = [
        {
            "type": ev.type,
            "score": ev.score,
            "weight": scoring_engine.weights.get(ev.type, 0.0),
            "details": ev.details_json
        }
        for ev in evidence_signals
    ]
    
    current_acs = result.acs
    new_acs = current_acs
    new_vl = result.vl
    
    # If postman confirmed, boost the score
    if confirm.postman_confirmed:
        address_dict = {
            "house_no": address.house_no,
            "street": address.street,
            "locality": address.locality,
            "city": address.city,
            "district": address.district,
            "state": address.state,
            "pin": address.pin,
            "digipin": address.digipin
        }
        
        new_acs, updated_evidence = scoring_engine.boost_score_with_admin_confirmation(
            current_acs, evidence, postman_confirmed=True
        )
        new_vl = scoring_engine.get_validation_level(new_acs)
        
        # Update evidence signals in DB
        for ev_db, ev_new in zip(evidence_signals, updated_evidence):
            ev_db.score = ev_new["score"]
            ev_db.details_json = ev_new["details"]
    
    # Override VL if specified
    if confirm.mark_vl:
        new_vl = confirm.mark_vl
    
    # Update result
    result.acs = new_acs
    result.vl = new_vl
    
    # Issue token if not already issued and score is high enough
    if not result.token_id and new_acs >= 65:
        address_dict = {
            "digipin": address.digipin,
            "locality": address.locality,
            "city": address.city,
            "pin": address.pin
        }
        
        jwt_token, expires_at = token_service.create_validation_token(
            confirm.request_id, address_dict, new_acs, new_vl, validation_req.requester_id
        )
        
        token = Token(
            validation_request_id=confirm.request_id,
            jwt=jwt_token,
            issued_at=datetime.utcnow(),
            expires_at=expires_at,
            revoked=False
        )
        db.add(token)
        db.commit()
        
        result.token_id = token.id
    
    db.commit()
    
    # Audit log
    audit = AuditLog(
        action="admin_confirmation",
        user_id=confirm.admin_id,
        details_json={
            "validation_id": confirm.request_id,
            "postman_confirmed": confirm.postman_confirmed,
            "old_acs": current_acs,
            "new_acs": new_acs,
            "new_vl": new_vl,
            "notes": confirm.notes
        },
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "request_id": confirm.request_id,
        "old_acs": current_acs,
        "new_acs": new_acs,
        "vl": new_vl,
        "message": "Validation confirmed and updated"
    }


@router.post("/revoke/{token_id}")
async def revoke_token(token_id: int, admin_id: str, reason: str, db: Session = Depends(get_db)):
    """Revoke a validation token"""
    
    token = db.query(Token).filter(Token.id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    if token.revoked:
        raise HTTPException(status_code=400, detail="Token already revoked")
    
    token.revoked = True
    db.commit()
    
    # Audit log
    audit = AuditLog(
        action="token_revoked",
        user_id=admin_id,
        details_json={"token_id": token_id, "reason": reason},
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    
    return {"success": True, "message": "Token revoked successfully"}


@router.get("/review/{request_id}")
async def get_validation_details(request_id: str, db: Session = Depends(get_db)):
    """Get full validation details for admin review"""
    
    validation_req = db.query(ValidationRequest).filter(ValidationRequest.id == request_id).first()
    if not validation_req:
        raise HTTPException(status_code=404, detail="Validation request not found")
    
    result = db.query(ValidationResult).filter(ValidationResult.validation_request_id == request_id).first()
    address = db.query(Address).filter(Address.id == validation_req.address_id).first()
    evidence = db.query(EvidenceSignal).filter(EvidenceSignal.validation_request_id == request_id).all()
    
    # Get audit logs
    audits = db.query(AuditLog).filter(
        AuditLog.details_json.contains(request_id)
    ).order_by(desc(AuditLog.timestamp)).all()
    
    return {
        "request_id": request_id,
        "status": validation_req.status,
        "created_at": validation_req.created_at.isoformat(),
        "consent": validation_req.consent_json,
        "address": {
            "house_no": address.house_no,
            "street": address.street,
            "locality": address.locality,
            "city": address.city,
            "district": address.district,
            "state": address.state,
            "pin": address.pin,
            "digipin": address.digipin
        } if address else None,
        "result": {
            "acs": result.acs,
            "vl": result.vl,
            "reason_codes": result.reason_codes,
            "suggestions": result.suggestions,
            "token_id": result.token_id
        } if result else None,
        "evidence": [
            {
                "type": ev.type,
                "score": ev.score,
                "details": ev.details_json,
                "timestamp": ev.timestamp.isoformat()
            }
            for ev in evidence
        ],
        "audit_trail": [
            {
                "action": audit.action,
                "admin_id": audit.user_id,
                "details": audit.details_json,
                "timestamp": audit.timestamp.isoformat()
            }
            for audit in audits
        ]
    }
