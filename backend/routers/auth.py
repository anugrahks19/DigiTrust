from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from database import get_db, User
from pydantic import BaseModel
from database import get_db, User
from pydantic import BaseModel
from datetime import datetime, timedelta
from utils.auth import verify_password, create_access_token, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
import os
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv() # Force load env vars

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
    responses={404: {"description": "Not found"}},
)

# Dynamic URLs (Fallback to Local defaults if Env Vars missing)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3002") 
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    name: str

# Demo User Credentials (Hardcoded for Hackathon)
DEMO_USERS = {
    "judge@digitrust.in": "demo123",
    "user@digitrust.in": "user123",
    "admin@digitrust.in": "admin123"
}

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint.
    For hackathon:
    - Checks against hardcoded demo users OR
    - Allows specific 'magic' logins if needed
    """
    try:
        email = request.email.lower().strip()
        
        # Simple password check
        if email in DEMO_USERS:
            if DEMO_USERS[email] != request.password:
                raise HTTPException(status_code=401, detail="Incorrect password")
        else:
            # Check if user exists in DB (Registered User)
            existing_user = db.query(User).filter(User.id == email).first()
            if not existing_user:
                 if request.password != "password" and request.password != "demo123":
                      raise HTTPException(status_code=401, detail="User not found. Please Sign Up first.")

        # Create or Get User in DB
        user_id = email
        db_user = db.query(User).filter(User.id == user_id).first()
        
        if not db_user:
            print(f"[DEBUG] Auto-registering demo user: {user_id}")
            # Auto-register
            db_user = User(
                id=user_id, 
                name=email.split('@')[0].title(),
                created_at=datetime.utcnow()
            )
            db.add(db_user)
            db.commit()
        
        # Create JWT
        print(f"[DEBUG] Minting token for {user_id}")
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_id}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user_id,
            "name": db_user.name or "User"
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Login Endpoint Crash: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

@router.post("/register", response_model=LoginResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register endpoint.
    Creates a new user with the provided details.
    """
    email = request.email.lower().strip()
    
    # Check if user already exists
    db_user = db.query(User).filter(User.id == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="User already exists. Please login.")
        
    # Create new user
    db_user = User(
        id=email,
        name=request.name.strip(),
        created_at=datetime.utcnow()
    )
    db.add(db_user)
    db.commit()
    
    # Create Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": email}, expires_delta=access_token_expires
    )
    
    from routers.audit import log_action
    log_action(db, user_id=email, action="USER_REGISTER", details={"name": request.name})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": email,
        "name": db_user.name
    }

class ForgotPasswordRequest(BaseModel):
    email: str

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Sends a real password reset email using Gmail SMTP.
    """
    email = request.email.lower().strip()
    
    # 1. Load Credentials
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass # Assume env vars are set otherwise
        
    import os
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    smtp_user = os.getenv("MAIL_USERNAME")
    smtp_pass = os.getenv("MAIL_PASSWORD")
    
    if not smtp_user or not smtp_pass:
        print("❌ Error: MAIL_USERNAME or MAIL_PASSWORD not set in .env")
        return {"message": "Email configuration missing on server."}

    # 2. Check User (Silent fail for security, but we verify here)
    user = db.query(User).filter(User.id == email).first()
    if not user:
        # Simulate time delay to prevent enumeration timing attacks
        import time
        time.sleep(1) 
        return {"message": "If an account exists, a reset link has been sent."}

    # 3. Generate Token & Link
    reset_token = str(uuid.uuid4())
    # Link points to static HTML file
    # Link points to static HTML file
    reset_link = f"{FRONTEND_URL}/reset-password.html?token={reset_token}&email={email}"
    
    # 4. Prepare Email
    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = email
    msg['Subject'] = "🔒 DigiTrust Password Reset"
    
    body = f"""
    <h2>Password Reset Request</h2>
    <p>Hello {user.name},</p>
    <p>We received a request to reset your DigiTrust password.</p>
    <p>Click the link below to verify your identity and set a new password:</p>
    <a href="{reset_link}" style="background:#4F46E5; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Reset Password</a>
    <p><small>If you didn't ask for this, you can safely ignore this email.</small></p>
    """
    msg.attach(MIMEText(body, 'html'))

    # 5. Send Email
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, email, msg.as_string())
        server.quit()
        print(f"✅ Email sent successfully to {email}")
        return {"message": "Reset link sent to your email."}
    except Exception as e:
        print(f"❌ Email sending failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


class ResetPasswordRequest(BaseModel):
    email: str
    token: str
    new_password: str

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Finalizes password reset.
    For this demo, we verify the user exists and simply return success.
    (Since we aren't storing passwords, there's nothing to update).
    """
    # Verify user exists
    user = db.query(User).filter(User.id == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # In a real app: Verify token validity and expiry from DB
    # In a real app: Hash new_password and save to user.password_hash
    
    print(f"🔐 Password reset confirmed for {request.email}. New Password: {request.new_password[:3]}***")
    
    return {"message": "Password updated successfully"}

# --- Social OAuth Endpoints ---

@router.get("/login/github")
def login_github():
    print("👉 /login/github hit")
    client_id = os.getenv("GITHUB_CLIENT_ID")
    print(f"👉 GitHub Client ID: {client_id}")
    if not client_id:
        return {"error": "Missing GITHUB_CLIENT_ID on server"}
    
    redirect_uri = f"{BACKEND_URL}/api/auth/callback/github"
    return {"url": f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&scope=user:email"}

@router.get("/callback/github")
async def callback_github(code: str, db: Session = Depends(get_db)):
    try:
        # 1. Exchange Code for Token
        import requests
        client_id = os.getenv("GITHUB_CLIENT_ID")
        client_secret = os.getenv("GITHUB_CLIENT_SECRET")
        
        token_res = requests.post("https://github.com/login/oauth/access_token", headers={"Accept": "application/json"}, data={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": f"{BACKEND_URL}/api/auth/callback/github"
        })
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            print(f"❌ GitHub Token Error: {token_data}")
            raise HTTPException(status_code=400, detail="GitHub Login Failed")

        # 2. Get User Info
        user_res = requests.get("https://api.github.com/user", headers={"Authorization": f"Bearer {access_token}"})
        user_data = user_res.json()
        
        # 3. Create Session/User logic
        email = user_data.get("email") or f"{user_data.get('login')}@github.com"
        name = user_data.get("name") or user_data.get("login")
        
        # Check if user exists, else create
        user = db.query(User).filter(User.id == email).first()
        if not user:
            user = User(id=email, name=name, password_hash=get_password_hash("social123"))
            db.add(user)
            db.commit()
            db.refresh(user)

        # 4. Mint Internal JWT
        access_token_expires = timedelta(minutes=60*24)
        access_token = create_access_token(
            data={"sub": email}, expires_delta=access_token_expires
        )
        
        from routers.audit import log_action
        log_action(db, user_id=email, action="LOGIN_GITHUB", details={"provider": "github"})
        
        frontend_redirect = f"{FRONTEND_URL}/?social_token={access_token}&user_name={name}&user_id={email}&provider=github"
        return RedirectResponse(url=frontend_redirect)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/login/discord")
def login_discord():
    client_id = os.getenv("DISCORD_CLIENT_ID")
    if not client_id:
        return {"error": "Missing DISCORD_CLIENT_ID on server"}

    redirect_uri = f"{BACKEND_URL}/api/auth/callback/discord"
    return {"url": f"https://discord.com/api/oauth2/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope=identify%20email"}

class GoogleLoginRequest(BaseModel):
    token: str
    email: str
    name: str
    picture: str | None = None

@router.post("/login/google", response_model=LoginResponse)
async def google_login(req: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Exchanges a Google Client Token for an Internal DigiTrust JWT.
    """
    print(f"👉 Google Login Request for: {req.email}")
    
    # 1. Upsert User
    user = db.query(User).filter(User.id == req.email).first()
    if not user:
        user = User(
            id=req.email, 
            name=req.name,
            created_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
    
    # 2. Mint Internal Token
    access_token_expires = timedelta(minutes=60*24) # 24 Hours
    access_token = create_access_token(
        data={"sub": req.email}, expires_delta=access_token_expires
    )
    
    # 3. Audit Log
    from routers.audit import log_action
    log_action(db, user_id=req.email, action="LOGIN_GOOGLE", details={"platform": "web"})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": req.email,
        "name": user.name
    }
    client_id = os.getenv("DISCORD_CLIENT_ID")
    redirect_uri = "http://localhost:8000/api/auth/callback/discord"
    return {"url": f"https://discord.com/api/oauth2/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope=identify%20email"}

@router.get("/callback/discord")
async def callback_discord(code: str, db: Session = Depends(get_db)):
    try:
        import requests
        client_id = os.getenv("DISCORD_CLIENT_ID")
        client_secret = os.getenv("DISCORD_CLIENT_SECRET")
        redirect_uri = f"{BACKEND_URL}/api/auth/callback/discord"
        
        data = {
            'client_id': client_id,
            'client_secret': client_secret,
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri
        }
        
        token_res = requests.post('https://discord.com/api/oauth2/token', data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
        token_data = token_res.json()
        discord_token = token_data.get("access_token")
        
        if not discord_token:
            print(f"❌ Discord Token Error: {token_data}")
            raise HTTPException(status_code=400, detail=f"Discord Login Failed: {token_data}")

        user_res = requests.get('https://discord.com/api/users/@me', headers={'Authorization': f'Bearer {discord_token}'})
        user_data = user_res.json()
        
        email = user_data.get("email")
        name = user_data.get("username")
        
        # Store/Update User
        user = db.query(User).filter(User.id == email).first()
        if not user:
            user = User(id=email, name=name, password_hash=get_password_hash("social123"))
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Mint Internal JWT
        access_token_expires = timedelta(minutes=60*24)
        access_token = create_access_token(
            data={"sub": email}, expires_delta=access_token_expires
        )
        
        from routers.audit import log_action
        log_action(db, user_id=email, action="LOGIN_DISCORD", details={"provider": "discord"})
        
        frontend_redirect = f"{FRONTEND_URL}/?social_token={access_token}&user_name={name}&user_id={email}&provider=discord"
        return RedirectResponse(url=frontend_redirect)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
