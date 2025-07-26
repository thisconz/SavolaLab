from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from uuid import UUID

# Schemas
from app.domain.schemas.user import UserRead, UserUpdate

# Enums
from app.domain.models.enums import UserRole

# Models
from app.domain.models.user import User

# Infrastructure
from app.infrastructure.security import get_password_hash
from app.infrastructure.database import get_db

# Services
from app.services import auth

router = APIRouter()

# --- User Endpoints ---

# Login user and get access token
@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Endpoint to log in a user and return an access token.
    Accepts username and password, authenticates the user, and returns a token.
    """
    user = auth.authenticate_user(db, form_data.username, form_data.password)

    if not user:
        raise HTTPException(status_code=400, detail="Invalid username or password")
    
    token = await auth.create_access_token_for_user(user)
    return {"access_token": token, "token_type": "bearer"}

# Accepts the user's employee ID, generates a new password, and sends it to the user's email.
@router.post("/forgot-password")
async def forgot_password(
    employee_id: str,
    db: Session = Depends(get_db),
):
    """
    Endpoint to reset a user's password.
    Accepts the user's employee ID, generates a new password, and sends it to the user's email.
    """
    # Check if the user exists
    user = auth.get_user_by_employee_id(db, employee_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate a new password
    new_password = auth.generate_password()

    # Create a new hashed password
    new_hashed_password = get_password_hash(new_password)

    # Update the user's password in the database
    user.password = new_hashed_password

    # Commit the changes to the database
    db.commit()
    db.refresh(user)

    # TODO: Implement email sending logic
    return {
        "message": "Password reset successful",
        "new_password": new_password,
        "employee_id": user.employee_id,
    }

# Get current user details
@router.get("/me", response_model=UserRead)
async def read_user_me(
    current_user=Depends(auth.get_current_user)
    ):
    """
    Endpoint to read the current user's details.
    Returns the details of the user making the request.
    """
    return current_user

# Update current user details
@router.put("/me", response_model=UserRead)
async def update_user_me(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    """
    Endpoint to update the current user's details.
    Allows updating employee ID, full name, role, and password.
    """
    # Check if the user exists
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate the role if provided
    if user_in.role and user_in.role not in [role.value for role in UserRole]:
        raise HTTPException(status_code=400, detail="Invalid role provided")
    
    updated_user = auth.update_user(
        db=db,
        user_id=UUID(str(current_user.id)),
        user_in=user_in,
    )
    return updated_user

# Get user details as an admin or QC Manager by employee ID
@router.get("/{employee_id}", response_model=UserRead)
async def read_user(
    employee_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(auth.get_current_user),
):
    """
    Endpoint to read a user's details by their employee ID.
    Only accessible by a QC Manager or the user themselves.
    """
    if user.role not in [UserRole.QC_MANAGER, UserRole.ADMIN] and user.employee_id != employee_id:
        raise HTTPException(status_code=403, detail="You do not have permission to view this user.")
    
    user = db.query(User).filter(User.employee_id == employee_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
