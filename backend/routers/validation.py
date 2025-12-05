from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, ValidationRequest, Address, User, EvidenceSignal, ValidationResult, Token, AuditLog
from models import ValidationRequestInput, ValidationResultOutput, ValidationHistoryItem, EvidenceComponent
from scoring_engine import ScoringEngine
from token_service import TokenService
import uuid
from datetime import datetime
import hashlib

router = APIRouter(prefix="/api", tags=["validation"])

scoring_engine = ScoringEngine()
token_service = TokenService()


def hash_pii(value: str) -> str:
    """Hash PII data for privacy"""
    return hashlib.sha256(value.encode()).hexdigest() if value else None


@router.post("/validate", response_model=ValidationResultOutput)
async def validate_address(request: ValidationRequestInput, db: Session = Depends(get_db)):
    """
    Submit an Address Validation Request (AVR)
    
    This endpoint:
    1. Creates/retrieves user
    2. Saves address
    3. Runs scoring engine
    4. Stores evidence signals
    5. Returns ACS, VL, evidence, and suggestions
    6. Issues token if ACS >= VL2 threshold
    """
    
    # Create or get user
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        user = User(id=request.user_id, created_at=datetime.utcnow())
        db.add(user)
    
    # Create address
    address_id = f"addr_{uuid.uuid4().hex[:12]}"
    address_data = request.address.dict()
    
    new_address = Address(
        id=address_id,
        user_id=request.user_id,
        **address_data,
        created_at=datetime.utcnow()
    )
    db.add(new_address)
    
    # Create validation request
    validation_id = f"vr_{uuid.uuid4().hex[:12]}"
    validation_request = ValidationRequest(
        id=validation_id,
        address_id=address_id,
        requester_id=request.user_id,
        consent_json=request.consent.dict(),
        status="processing",
        created_at=datetime.utcnow()
    )
    db.add(validation_request)
    db.commit()
    
    # Run scoring engine
    try:
        acs, evidence, reason_codes, suggestions, advanced_metrics = scoring_engine.calculate_acs(address_data, db)
        vl = scoring_engine.get_validation_level(acs)
        
        # Store evidence signals
        for ev in evidence:
            signal = EvidenceSignal(
                validation_request_id=validation_id,
                type=ev["type"],
                score=ev["score"],
                details_json=ev["details"],
                timestamp=datetime.utcnow()
            )
            db.add(signal)
        
        # Store result
        result = ValidationResult(
            validation_request_id=validation_id,
            acs=acs,
            vl=vl,
            reason_codes=reason_codes,
            suggestions=suggestions,
            created_at=datetime.utcnow()
        )
        db.add(result)
        
        # Issue token if ACS is high enough (VL2 or VL3)
        token_available = False
        token_id = None
        
        if acs >= 65:  # VL2 threshold
            jwt_token, expires_at = token_service.create_validation_token(
                validation_id, address_data, acs, vl, request.user_id
            )
            qr_data = token_service.create_qr_data(jwt_token, validation_id)
            
            token = Token(
                validation_request_id=validation_id,
                jwt=jwt_token,
                issued_at=datetime.utcnow(),
                expires_at=expires_at,
                revoked=False
            )
            db.add(token)
            db.commit()
            
            token_id = token.id
            token_available = True
            
            # Update result with token_id
            result.token_id = token_id
        
        # Update status
        validation_request.status = "done"
        db.commit()
        
        # Audit log
        audit = AuditLog(
            action="validation_completed",
            user_id=request.user_id,
            details_json={"validation_id": validation_id, "acs": acs, "vl": vl},
            timestamp=datetime.utcnow()
        )
        db.add(audit)
        db.commit()
        
        # Build response
        evidence_output = [
            EvidenceComponent(
                type=ev["type"],
                score=ev["score"],
                weight=ev["weight"],
                details=ev["details"]
            )
            for ev in evidence
        ]
        
        return ValidationResultOutput(
            request_id=validation_id,
            acs=acs,
            vl=vl,
            reason_codes=reason_codes,
            suggestions=suggestions,
            evidence=evidence_output,
            token_available=token_available,
            token_id=token_id,
            fraud_risk=advanced_metrics.get('fraud_risk'),
            position_confidence_meters=advanced_metrics.get('position_confidence_meters'),
            escalation_path=advanced_metrics.get('escalation_path'),
            address_fingerprint=advanced_metrics.get('address_fingerprint'),
            category_avg_comparison=advanced_metrics.get('category_avg_comparison')
        )
        
    except Exception as e:
        validation_request.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.get("/result/{request_id}", response_model=ValidationResultOutput)
async def get_validation_result(request_id: str, db: Session = Depends(get_db)):
    """Get validation result by request ID"""
    
    validation_request = db.query(ValidationRequest).filter(ValidationRequest.id == request_id).first()
    if not validation_request:
        raise HTTPException(status_code=404, detail="Validation request not found")
    
    result = db.query(ValidationResult).filter(ValidationResult.validation_request_id == request_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    # Get evidence
    evidence_signals = db.query(EvidenceSignal).filter(EvidenceSignal.validation_request_id == request_id).all()
    evidence_output = [
        EvidenceComponent(
            type=ev.type,
            score=ev.score,
            weight=0.0,  # Will be filled from scoring engine weights
            details=ev.details_json
        )
        for ev in evidence_signals
    ]
    
    # Check token availability
    token = db.query(Token).filter(Token.id == result.token_id).first() if result.token_id else None
    token_available = token is not None and not token.revoked
    
    return ValidationResultOutput(
        request_id=request_id,
        acs=result.acs,
        vl=result.vl,
        reason_codes=result.reason_codes,
        suggestions=result.suggestions,
        evidence=evidence_output,
        token_available=token_available,
        token_id=result.token_id
    )


@router.get("/token/{request_id}")
async def get_token(request_id: str, db: Session = Depends(get_db)):
    """Download signed validation token"""
    
    result = db.query(ValidationResult).filter(ValidationResult.validation_request_id == request_id).first()
    if not result or not result.token_id:
        raise HTTPException(status_code=404, detail="Token not available for this validation")
    
    token = db.query(Token).filter(Token.id == result.token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    if token.revoked:
        raise HTTPException(status_code=403, detail="Token has been revoked")
    
    qr_data = token_service.create_qr_data(token.jwt, request_id)
    
    return {
        "token_id": token.id,
        "jwt": token.jwt,
        "qr_data": qr_data,
        "issued_at": token.issued_at.isoformat(),
        "expires_at": token.expires_at.isoformat(),
        "validation_id": request_id
    }


@router.get("/history/{user_id}")
async def get_user_history(user_id: str, db: Session = Depends(get_db)):
    """Get user's validation history"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"history": []}
    
    # Get all validation requests for this user
    validations = db.query(ValidationRequest).filter(
        ValidationRequest.requester_id == user_id
    ).order_by(ValidationRequest.created_at.desc()).limit(20).all()
    
    history = []
    for val_req in validations:
        result = db.query(ValidationResult).filter(ValidationResult.validation_request_id == val_req.id).first()
        address = db.query(Address).filter(Address.id == val_req.address_id).first()
        
        if result and address:
            token = db.query(Token).filter(Token.id == result.token_id).first() if result.token_id else None
            token_available = token is not None and not token.revoked
            
            history.append({
                "request_id": val_req.id,
                "address": {
                    "house_no": address.house_no,
                    "street": address.street,
                    "locality": address.locality,
                    "city": address.city,
                    "district": address.district,
                    "state": address.state,
                    "pin": address.pin,
                    "digipin": address.digipin
                },
                "acs": result.acs,
                "vl": result.vl,
                "created_at": val_req.created_at.isoformat(),
                "token_available": token_available
            })
    
    return {"history": history}
