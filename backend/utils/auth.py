import os
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from passlib.context import CryptContext
from sqlalchemy.orm import Session # Added: Import Session
from database import get_db, User # Added: Import get_db and User

load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "hackathon_secret_key_123") # Modified: Changed default SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") # Moved: Defined earlier
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login") # Moved: Defined earlier

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    try:
        print(f"[DEBUG] Hashing password: Type={type(password)}, Length={len(str(password))}, Value={str(password)[:10]}...")
        if len(str(password)) > 70:
            print(f"⚠️ WARNING: Password too long for bcrypt! Truncating to 50 chars.")
            password = str(password)[:50]
        return pwd_context.hash(password)
    except Exception as e:
        print(f"❌ Hashing Failed: {e}")
        raise e

def create_access_token(data: dict, expires_delta: timedelta | None = None): # Modified: Type hint for expires_delta
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)): # Added: New function
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"[DEBUG] Validating Token: {token[:10]}...") 
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        print(f"[DEBUG] Token Decoded. User ID: {user_id}")
        
        if user_id is None:
            print("[DEBUG] User ID is None in payload")
            raise credentials_exception
            
    except JWTError as e:
        print(f"[DEBUG] JWT Validation Failed: {str(e)}")
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        print(f"[DEBUG] User {user_id} not found in database!")
        raise credentials_exception
        
    print(f"[DEBUG] User {user_id} authenticated successfully.")
    return user

def verify_token(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return user_id
    except JWTError:
        raise credentials_exception

def get_current_user_id(user_id: str = Depends(verify_token)) -> str:
    """Dependency to get the current authenticated user ID"""
    return user_id
