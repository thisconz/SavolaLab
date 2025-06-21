from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from uuid import UUID

from app.domain.schemas.user import UserRead, UserUpdate, UserLogin
from app.domain.models.enums import UserRole
from app.domain.models.user import User
from app.infrastructure.security import get_password_hash
from app.infrastructure.database import get_db
from app.services import auth

router = APIRouter()

# This endpoint allows a user to log in and receive an access token.
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

# This endpoint for Forgot Password
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

    # TODO: Implement email sending
    return {
        "message": "Password reset successful",
        "new_password": new_password,
        "employee_id": user.employee_id,
    }

# This endpoint allows a user to read their own details.
@router.get("/me", response_model=UserRead)
async def read_user_me(
    current_user=Depends(auth.get_current_user)
    ):
    """
    Endpoint to read the current user's details.
    Returns the details of the user making the request.
    """
    return current_user

# This endpoint allows a user to update their own details.
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
    user = auth.get_user_by_employee_id(db, user_in.employee_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = auth.update_user(
        db=db,
        user_id=UUID(str(current_user.id)),
        user_in=user_in,
    )
    return updated_user

# This endpoint allows a QC Manager or Admin to read any user's details by their employee ID.
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
