from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, ApiKey, User
from utils.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter(
    prefix="/api/developers",
    tags=["Developers"],
    responses={404: {"description": "Not found"}},
)

class ApiKeyResponse(BaseModel):
    key: str
    created_at: datetime
    is_active: bool

@router.post("/generate-key", response_model=ApiKeyResponse)
async def generate_api_key(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a new API key for the current user.
    Invalidates previous keys (optional, but good for simple sandbox).
    """
    # Check if key exists
    existing_key = db.query(ApiKey).filter(ApiKey.user_id == current_user.id, ApiKey.is_active == True).first()
    if existing_key:
        existing_key.is_active = False # Deactivate old key
    
    new_key_str = f"sk_live_{uuid.uuid4().hex}"
    new_key = ApiKey(user_id=current_user.id, key=new_key_str)
    db.add(new_key)
    db.commit()
    db.refresh(new_key)
    
    # Log this action
    from routers.audit import log_action
    log_action(db, user_id=current_user.id, action="GENERATE_API_KEY", details={"key_id": new_key.id})
    
    return {
        "key": new_key.key,
        "created_at": new_key.created_at,
        "is_active": new_key.is_active
    }

@router.get("/my-key", response_model=ApiKeyResponse | None)
async def get_my_key(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    key = db.query(ApiKey).filter(ApiKey.user_id == current_user.id, ApiKey.is_active == True).order_by(ApiKey.created_at.desc()).first()
    if not key:
        return None
        
    return {
        "key": key.key,
        "created_at": key.created_at,
        "is_active": key.is_active
    }
