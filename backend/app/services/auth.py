# This module provides authentication and user management services.
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.infrastructure.database import get_db
from sqlalchemy.orm import Session
from app.domain.models.user import User
from app.domain.schemas.user import UserCreate
from app.domain.models.enums import UserRole
from app.infrastructure.security import get_password_hash, verify_password, create_access_token

# --- O Authentication 2 Password Bearer ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

# --- Authentication and Authorization ---

# Gets the current user based on the Employee ID.
async def get_user_by_employee_id(db: Session, employee_id: str) -> User | None:
    return db.query(User).filter(User.employee_id == employee_id).first()
    
# Registers a new user.
async def register_user(db: Session, user_in: UserCreate) -> User:
    hashed_password = get_password_hash(user_in.password)

    # Normalize role input (str or None) to enum
    if isinstance(user_in.role, str):
        user_in.role = UserRole[user_in.role.upper()]

    # If role is None, set it to UserRole.OTHER
    elif user_in.role is None:
        user_in.role = UserRole.OTHER
    
    # Create the user
    user = User(
        employee_id=user_in.employee_id,
        full_name=user_in.full_name,
        password=hashed_password,
        role=user_in.role.value 
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# Verifies the password against the hashed password.
async def authenticate_user(
        db: Session, 
        employee_id: str, 
        password: str) -> User | None:
    user = await get_user_by_employee_id(db, employee_id)
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user

# Creates an access token for the user.
async def create_access_token_for_user(
        user: User) -> str:
    data = {"sub": user.employee_id, "role": user.role.value}
    return create_access_token(data)

# Returns the decoded access token.
def decode_access_token(
        token: str) -> dict | None:
    from app.infrastructure.security import decode_access_token
    return decode_access_token(token)

# Returns the current user based on the token.
def get_current_user(
        token: str = Depends(oauth2_scheme), 
        db: Session = Depends(get_db)) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    employee_id = payload.get("sub")
    if not employee_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    user = db.query(User).filter(User.employee_id == employee_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

# Checks if the user has a role.
def user_has_role(
        user: User, 
        role: UserRole) -> bool:
    return user.role == role

# Role-based access control functions

# Is Admin
def is_admin(
        user: User) -> bool:
    return user_has_role(user, UserRole.ADMIN)

# Is QC Manager
def is_qc_manager(
        user: User) -> bool:
    return user_has_role(user, UserRole.QC_MANAGER)

# Is Shift Chemist
def is_shift_chemist(
        user: User) -> bool:
    return user_has_role(user, UserRole.SHIFT_CHEMIST)

# Is Chemist
def is_chemist(
        user: User) -> bool:
    return user_has_role(user, UserRole.CHEMIST)

# Is Other
def is_other(
        user: User) -> bool:
    return user_has_role(user, UserRole.OTHER)
