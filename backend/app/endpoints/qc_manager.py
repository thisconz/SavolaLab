from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Models
from app.domain.models import User

# Schemas
from app.domain.schemas import UserRead, UserCreate, UserRole

# Services
from app.services import get_current_user, auth

# Database
from app.infrastructure.database import get_db

# Dependencies
from app.endpoints._deps import admin_or_qc_manager

router = APIRouter()

# --- QC Manager Endpoints ---

# Get QC Manager Details
@router.get("/qc_manager", response_model=UserRead)
async def get_qc_manager(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    user: User = Depends(admin_or_qc_manager),
    ):
    """
    Endpoint to retrieve the QC Manager's details.
    This is a placeholder endpoint that returns the current user's details
    if the current user is a QC Manager or Admin.

    Responses:
    - 200: Success
    - 401: Unauthorized access
    - 402: Admin and QC Manager roles only
    """
    # 401: Unauthorized access
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized access")
    
    # 402: Admin and QC Manager roles only
    if user.role not in ["admin", "qc_manager"]:
        raise HTTPException(status_code=402, detail="Admin and QC Manager roles only")

    # Return the user
    return UserRead.from_orm(user)

# Get All Users
@router.get("/users", response_model=list[UserRead])
async def list_users(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    user: User = Depends(admin_or_qc_manager),
):
    """
    Endpoint to list all users.
    This is a placeholder endpoint that returns a list of all users
    if the current user is a QC Manager or Admin.

    Responses:
    - 200: Success
    - 404: User not found
    - 500: Internal server error
    """
    users = db.query(User).all()
    # User not found (If the user is not found)
    if not users:
        raise HTTPException(status_code=404, detail="User not found")

    # Internal server error (If the user role is not valid)
    for user in users:
        if isinstance(user.role, str):
            try:
                user.role = UserRole(user.role.lower())
            except ValueError:
                raise HTTPException(status_code=500, detail=f"Invalid role: {user.role}")

    # Return the list of users
    return users

# Get User by Employee ID
@router.get("/users/{employee_id}", response_model=UserRead)
async def get_user_by_employee_id(
    employee_id: str, 
    db: Session = Depends(get_db),
    user: User = Depends(admin_or_qc_manager),
    ):
    """
    Endpoint to retrieve a user's details by their employee ID.
    This is a placeholder endpoint that returns the user details
    if the current user is a QC Manager.

    Responses:
    - 200: User details retrieved successfully
    - 404: User not found
    - 500: Internal server error
    """
    user = db.query(User).filter(User.employee_id == employee_id).first()

    # User not found (If the user is not found)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Internal server error (If the user role is not valid)
    if isinstance(user.role, str):
        try:
            user.role = UserRole(user.role.lower())
        except ValueError:
            raise HTTPException(status_code=500, detail=f"Invalid role: {user.role}")

    # Return the user details
    return user

# Create User
@router.post("/create", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    user: User = Depends(admin_or_qc_manager),
):
    """
    Endpoint to create a new user.
    Only accessible by a QC Manager or Admin.

    Responses:
        - 201: User created successfully
        - 401: Can not make QC Manager or Admin role a user
        - 409: Employee ID already registered
    """
    # Can not make QC Manager or Admin role a user
    if user_in.role in [UserRole.QC_MANAGER, UserRole.ADMIN]:
        raise HTTPException(status_code=401, detail="Can not make QC Manager or Admin role a user")

    # Check if user already exists
    existing_user = auth.get_user_by_employee_id(db, user_in.employee_id)
    if existing_user:
        raise HTTPException(status_code=409, detail="Employee ID already registered")

    user = await auth.register_user(db, user_in)
    return {
        "id": user.id,
        "employee_id": user.employee_id,
        "full_name": user.full_name,
        "role": user.role,
        "user": user
    }

# Change User Role by Employee ID
@router.put("/users/{employee_id}/role", response_model=UserRead)
def change_role_by_employee_id(
    employee_id: str, 
    new_role: UserRole, 
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    _: User = Depends(admin_or_qc_manager),
):
    """
    Change the role of a user to Shift Chemist, Chemist, or Other.

    Responses:
        - 200: Role updated successfully
        - 400: QC Manager cannot make Admin or QC Manager
        - 404: User not found
        - 500: Internal server error
    """
    
    # QC Manager cannot make Admin or QC Manager
    if user.role == UserRole.QC_MANAGER and new_role in [UserRole.ADMIN, UserRole.QC_MANAGER]:
        raise HTTPException(status_code=400, detail="QC Manager cannot make Admin or QC Manager")
    
    target_user = db.query(User).filter(User.employee_id == employee_id).first()

    # User not found (If the user is not found)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Internal server error (If the user role is not valid)
    if isinstance(target_user.role, str):
        try:
            target_user.role = UserRole(target_user.role.lower())
        except ValueError:
            raise HTTPException(status_code=500, detail=f"Invalid role: {target_user.role}")
    
    # Update and save
    target_user.role = new_role
    db.commit()
    db.refresh(target_user)

    return UserRead.from_orm(target_user)