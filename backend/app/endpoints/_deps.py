from fastapi import Depends, HTTPException, status

# Models
from app.domain.models.user import User

# Services
from app.services.auth import is_qc_manager, get_current_user, is_admin

# Enums
from app.domain.models.enums import UserRole

# --- Dependencies ---

# Admin-only dependency
def admin_only(user: User = Depends(get_current_user)) -> User:
    if not is_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to administrators only"
        )
    return user

# Admin or QC Manager dependency
def admin_or_qc_manager(user: User = Depends(get_current_user)) -> User:
    if not is_admin(user) and not is_qc_manager(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to authorized QC roles only"
        )
    return user

# Allowed QC Roles dependency
def qc_roles_allowed(*allowed_roles: UserRole):
    def wrapper(user: User = Depends(get_current_user)) -> User:        
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access restricted to authorized QC roles only"
            )
        return user
    return wrapper

# Usage-specific dependency
allowed_qc_roles = qc_roles_allowed(
    UserRole.ADMIN,
    UserRole.QC_MANAGER,
    UserRole.SHIFT_CHEMIST,
    UserRole.CHEMIST
)
