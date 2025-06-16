from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.domain.schemas.user import UserCreate, UserRead, UserUpdate, UserLogin
from app.domain.models.enums import UserRole
from app.infrastructure.security import get_password_hash
from app.infrastructure.database import get_db
from app.services import auth
from app.services.auth import get_current_user

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
    user = await auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid username or password")
    token = await auth.create_access_token_for_user(user)
    return {"access_token": token, "token_type": "bearer"}

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
    current_user=Depends(auth.get_current_user),
):
    """
    Endpoint to update the current user's details.
    Allows updating employee ID, full name, role, and password.
    """
    if user_in.password:
        current_user.hashed_password = get_password_hash(user_in.password)
    if user_in.full_name:
        current_user.full_name = user_in.full_name
    if user_in.role and current_user.role == UserRole.QC_MANAGER:
        current_user.role = user_in.role
    db.commit()
    db.refresh(current_user)
    return current_user

# This endpoint allows a QC Manager to read any user's details by their employee ID.
@router.get("/{employee_id}", response_model=UserRead)
async def read_user(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    """
    Endpoint to read a user's details by their employee ID.
    Only accessible by a QC Manager or the user themselves.
    """
    if current_user.role != UserRole.QC_MANAGER and current_user.employee_id != employee_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not employee_id:
        raise HTTPException(status_code=400, detail="Employee ID is required")
    user = await auth.get_user_by_employee_id(db, employee_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

# This endpoint for registering a new user without admin or qc manager role.
@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Endpoint to register a new user.
    Only accessible by users without admin or QC Manager roles.
    """
    existing_user = await auth.get_user_by_employee_id(db, user_in.employee_id)
    if existing_user:
        raise HTTPException(status_code=400, detail="Employee ID already registered")
    
    user = await auth.register_user(db, user_in)
    return user
