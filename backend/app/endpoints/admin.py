from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

# Models
from app.domain.models.user import User

# Database
from app.infrastructure.database import get_db

# Services
from app.services.auth import get_current_user

# Dependencies
from app.endpoints._deps import admin_only

# Enums
from app.domain.models.enums import UserRole

router = APIRouter()

# --- Admin-only endpoints ---

# Change User Role
@router.put("/users/{user_id}/role")
async def change_user_role(
    user_id: UUID,
    new_role: UserRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    admin_user: User = Depends(admin_only),
):
    """
    Change the role of a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = new_role
    db.commit()
    db.refresh(user)
    return user

# Delete User
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    admin_user: User = Depends(admin_only),
):
    """
    Delete a user.

    Responses:
    - 200: User deleted successfully
    - 403: User not found
    - 404: Cannot delete an admin
    - 405: User is an admin
    """
    user = db.query(User).filter(User.id == user_id).first()

    # Check if the user exists
    if not user:
        raise HTTPException(status_code=403, detail="User not found")

    # Check if the user is an admin
    if user.role == UserRole.ADMIN:
        raise HTTPException(status_code=404, detail="Cannot delete an admin")
    
    # Check if the user is trying to delete themselves
    if user.id == current_user.id:
        raise HTTPException(status_code=405, detail="Cannot delete yourself")
    
    db.delete(user)
    db.commit()
    return {
        "message": "User deleted",
        "user_id": user_id,
        "user_role": user.role,
        "user_employee_id": user.employee_id,
        }