import secrets
import string
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from uuid import UUID

# Enums
from app.domain.models.enums import UserRole

# Models
from app.domain.models.user import User

# Schemas
from app.domain.schemas.user import UserCreate, UserUpdate

# Infrastructure
from app.infrastructure.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.infrastructure.database import get_db

# --- Authentication and Authorization ---

# --- O Authentication 2 Password Bearer ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

def generate_password(length: int = 12) -> str:

    # Generate a random password
    chars = string.ascii_letters + string.digits + "!@#$%^&*()_+-="

    # Return the password
    return ''.join(secrets.choice(chars) for _ in range(length))

# Gets the current user based on the Employee ID.
def get_user_by_employee_id(db: Session, employee_id: str) -> User | None:
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
        department=user_in.department,
        password=hashed_password,
        role=user_in.role.value 
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# Verifies the password against the hashed password.
def authenticate_user(
        db: Session, 
        employee_id: str, 
        password: str) -> User | None:
    
    # Get the user from the database
    user = get_user_by_employee_id(db, employee_id)
    if not user:
        return None
    
    # Verify the password
    if not verify_password(password, user.password):
        return None
    
    # Return the user
    return user

# Creates an access token for the user.
async def create_access_token_for_user(
        user: User) -> str:
    
    # Print the user details
    print(f"Creating token for: employee_id={user.employee_id}, full_name={user.full_name}, department={user.department}")
    
    # Create the access token
    data = {"sub": user.employee_id, 
            "role": user.role.value,
            "full_name": user.full_name,
            "department": user.department,
            }

    # Return the access token
    return create_access_token(data)

# Returns the current user based on the token.
def get_current_user(
        token: str = Depends(oauth2_scheme), 
        db: Session = Depends(get_db)) -> User:
    
    # Decode the access token
    payload = decode_access_token(token)

    # Check if the token is valid
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    # Get the employee ID from the payload
    employee_id = payload.get("sub")

    # Check if the employee ID exists
    if not employee_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    # Get the user from the database
    user = db.query(User).filter(User.employee_id == employee_id).first()

    # Check if the user exists
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    # Return the user
    return user

# Updates the user's details.
def update_user(
        db: Session,
        user_id: UUID,
        user_in: UserUpdate) -> User:
    
    # Get the user from the database
    user = db.query(User).filter(User.id == user_id).first()

    # Update the user's details
    if user_in.employee_id:
        user.employee_id = user_in.employee_id
    if user_in.full_name:
        user.full_name = user_in.full_name
    if user_in.role:
        user.role = user_in.role
    if user_in.password:
        user.password = get_password_hash(user_in.password)

    # Commit the changes to the database
    db.commit()
    db.refresh(user)
    return user

# Checks if the user has a role.
def user_has_role(
        user: User, 
        role: UserRole) -> bool:
    
    # Return True if the user has the role, False otherwise
    return user.role == role

# --- Role-based access control functions ---

# Is Admin
def is_admin(
        user: User) -> bool:
    
    # Return True if the user is an admin, False otherwise
    return user_has_role(user, UserRole.ADMIN)

# Is QC Manager
def is_qc_manager(
        user: User) -> bool:
    
    # Return True if the user is a qc manager, False otherwise
    return user_has_role(user, UserRole.QC_MANAGER)

# Is Shift Chemist
def is_shift_chemist(
        user: User) -> bool:
    
    # Return True if the user is a shift chemist, False otherwise
    return user_has_role(user, UserRole.SHIFT_CHEMIST)

# Is Chemist
def is_chemist(
        user: User) -> bool:
    
    # Return True if the user is a chemist, False otherwise
    return user_has_role(user, UserRole.CHEMIST)

# Is Other
def is_other(
        user: User) -> bool:
    
    # Return True if the user is an other, False otherwise
    return user_has_role(user, UserRole.OTHER)


