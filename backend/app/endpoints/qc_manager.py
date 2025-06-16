from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.domain.models import User
from app.domain.schemas import UserRead, UserCreate
from app.domain.schemas import UserRole
from app.services import get_current_user, auth
from app.infrastructure.database import get_db
from app.endpoints._deps import admin_or_qc_manager

router = APIRouter()

# Endpoint to get the QC Manager's details
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
    - 500: Internal server error
    """
    # 500: Internal server error (If the user role is not valid)
    if isinstance(user.role, str):
        try:
            user.role = UserRole(user.role.lower())
        except ValueError:
            raise HTTPException(status_code=500, detail=f"Invalid role: {user.role}")

    # Return the user
    return UserRead.from_orm(user)

# This endpoint allows a QC Manager or Admin to list all users.
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
    # 404: User not found (If the user is not found)
    if not users:
        raise HTTPException(status_code=404, detail="User not found")

    # 500: Internal server error (If the user role is not valid)
    for user in users:
        if isinstance(user.role, str):
            try:
                user.role = UserRole(user.role.lower())
            except ValueError:
                raise HTTPException(status_code=500, detail=f"Invalid role: {user.role}")

    # Return the list of users
    return users

# This endpoint allows a QC Manager to retrieve a specific user's details by employee ID.
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

    # 404: User not found (If the user is not found)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 500: Internal server error (If the user role is not valid)
    if isinstance(user.role, str):
        try:
            user.role = UserRole(user.role.lower())
        except ValueError:
            raise HTTPException(status_code=500, detail=f"Invalid role: {user.role}")

    # Return the user details
    return user

# This endpoint allows a QC Manager or Admin to create a new user.
@router.post("/create", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
    user: User = Depends(admin_or_qc_manager),
):
    """
    Endpoint to create a new user.
    Only accessible by a QC Manager or Admin.

    Responses:
        - 201: User created successfully
        - 401: Invalid role
        - 409: Employee ID already registered
    """
    # Can not make QC Manager or Admin role a user
    if user_in.role in [UserRole.QC_MANAGER, UserRole.ADMIN]:
        raise HTTPException(status_code=401, detail="Invalid role")

    # Check if user already exists
    existing_user = await auth.get_user_by_employee_id(db, user_in.employee_id)
    if existing_user:
        raise HTTPException(status_code=409, detail="Employee ID already registered")

    user = await auth.register_user(db, user_in)
    return user

# Endpoint to chanege user a role to QC Manager or Shift Chemist or Chemist or Other.
@router.put("/{user_id}/role")
async def change_user_role(
    employee_id: str,
    new_role: UserRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    admin_user: User = Depends(admin_or_qc_manager),
):
    """
    Change the role of a user.

    """
    user = db.query(User).filter(User.employee_id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = new_role
    db.commit()
    db.refresh(user)
    return user
