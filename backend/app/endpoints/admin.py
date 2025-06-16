from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.domain.models.user import User
from app.infrastructure.database import get_db
from app.services.auth import get_current_user
from app.endpoints._deps import admin_only
from app.domain.models.enums import UserRole

router = APIRouter()

# Endpoint to chanege user a role.
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

# Endpoint to delete a user.
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    admin_user: User = Depends(admin_only),
):
    """
    Delete a user.
    """
    user = db.query(User).filter(User.id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}