import jwt
from datetime import datetime, timedelta
import os
import json
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "hackathon_demo_secret_key")
ALGORITHM = "HS256"
TOKEN_EXPIRY_DAYS = 365


class TokenService:
    """JWT Token Service for signing validation results"""
    
    @staticmethod
    def create_validation_token(
        validation_request_id: str,
        address: dict,
        acs: float,
        vl: str,
        user_id: str
    ) -> tuple[str, datetime]:
        """
        Create a signed JWT token for a validated address
        
        Returns:
            - jwt_string: Signed JWT token
            - expires_at: Expiry datetime
        """
        now = datetime.utcnow()
        expires_at = now + timedelta(days=TOKEN_EXPIRY_DAYS)
        
        payload = {
            "validation_id": validation_request_id,
            "user_id": user_id,
            "acs": acs,
            "vl": vl,
            "address": {
                "digipin": address.get("digipin"),
                "locality": address.get("locality"),
                "city": address.get("city"),
                "pin": address.get("pin")
            },
            "issued_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "issuer": "DigiTrust-AVP",
            "purpose": "address_validation"
        }
        
        jwt_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        return jwt_token, expires_at
    
    @staticmethod
    def verify_token(token: str) -> dict:
        """
        Verify a JWT token and return payload
        
        Raises:
            Exception if token is invalid or expired
        """
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            
            # Check expiry
            expires_at = datetime.fromisoformat(payload["expires_at"])
            if datetime.utcnow() > expires_at:
                raise Exception("Token has expired")
            
            return payload
        except Exception as e:
            raise Exception(f"Invalid token: {str(e)}")
    
    @staticmethod
    def create_qr_data(jwt_token: str, validation_request_id: str) -> str:
        """
        Create QR-compatible JSON data for display
        """
        qr_payload = {
            "type": "DigiTrust-AVP-Token",
            "version": "1.0",
            "token": jwt_token,
            "validation_id": validation_request_id,
            "verify_url": f"https://digitrust.gov.in/verify?token={validation_request_id}"
        }
        return json.dumps(qr_payload)
