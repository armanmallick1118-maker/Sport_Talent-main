"""
ATHENA Auth & Security Module.
Provides:
- Role-based Access Control (PLAYER, COACH, INSTITUTION, ENTERPRISE, ADMIN)
- Password hashing & verification
- Session token generation & extraction
"""
import hashlib
import hmac
import os
import time
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = os.getenv("ATHENA_SECRET_KEY", "athena-secure-secret-key-2026-prod-ready")
bearer_scheme = HTTPBearer(auto_error=False)

def hash_password(password: str, salt: str = "athena_salt") -> str:
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str, salt: str = "athena_salt") -> bool:
    return hash_password(plain_password, salt) == hashed_password

def create_access_token(user_id: int, username: str, role: str) -> str:
    payload = f"{user_id}:{username}:{role}:{int(time.time())}"
    signature = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{signature}"

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.split(":")
        if len(parts) != 5:
            return None
        user_id, username, role, ts, sig = parts
        expected_sig = hmac.new(SECRET_KEY.encode(), f"{user_id}:{username}:{role}:{ts}".encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        return {
            "user_id": int(user_id),
            "username": username,
            "role": role,
            "timestamp": int(ts)
        }
    except Exception:
        return None

def get_current_user_payload(credentials: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme)) -> Dict[str, Any]:
    # In development/demo, default to user 1 if no auth header provided, allowing immediate seamless local exploration
    if not credentials:
        return {"user_id": 1, "username": "demo_athlete", "role": "PLAYER"}
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

def require_role(allowed_roles: list):
    def role_checker(payload: Dict[str, Any] = Depends(get_current_user_payload)):
        if payload.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role: {payload.get('role')}"
            )
        return payload
    return role_checker
