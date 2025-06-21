from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError
from typing import Optional

# Import settings
from .config import settings

# --- Security utilities ---

#  Cryptographic context for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Get the password hash of a plain password.
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Verify a plain password against a hashed password.
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Create a JWT access token
def create_access_token(
        data: dict, 
        expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

# Decode a JWT access token.
def decode_access_token(
        token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
