from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, AuditLog, User
from utils.auth import get_current_user
from typing import List
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(
    prefix="/api/audit",
    tags=["Audit Logs"],
    responses={404: {"description": "Not found"}},
)

class AuditLogSchema(BaseModel):
    id: int
    action: str
    details_json: dict | None
    timestamp: datetime

    class Config:
        orm_mode = True

@router.get("/logs", response_model=List[AuditLogSchema])
async def get_my_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch audit logs for the currently logged-in user.
    Shows transparency on what actions were taken on their account.
    """
    logs = db.query(AuditLog).filter(
        (AuditLog.user_id == current_user.id)
    ).order_by(AuditLog.timestamp.desc()).limit(50).all()
    
    return logs

def log_action(db: Session, user_id: str, action: str, details: dict = None):
    """
    Helper to create an audit log entry.
    """
    try:
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            details_json=details or {}
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        print(f"❌ Failed to write audit log: {e}")
