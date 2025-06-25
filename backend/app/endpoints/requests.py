from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

# Services
from app.services import request_logic, get_current_user

# Database
from app.infrastructure.database import get_db

# Models
from app.domain.models.user import User

# Schemas
from app.domain.schemas.request import RequestCreate, RequestUpdate

# Dependencies
from app.endpoints._deps import qc_roles_allowed, other_roles_allowed

# Enums
from app.domain.models.enums import UserRole

router = APIRouter()

# --- Request Endpoints ---

# Create a new request TO the QC Department (Only Other Role)
@router.post("/lab")
async def create_request_to_qc(
    request_data: RequestCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Users with role 'other' or 'admin' can create a request TO the QC department.

    Responses:
    - 201: Request created successfully
    - 401: Unauthorized access
    - 402: User cannot create this request
    - 403: User does not have permission to create this request
    """
    # 401: Unauthorized access
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized access")

    # 402: User cannot create this request because they are not the same employee
    if user.employee_id != request_data.requested_by:
        raise HTTPException(status_code=402, detail="You cannot create a request for another employee.")

    # 403: User does not have permission to create this request
    allowed_roles = other_roles_allowed(UserRole.ADMIN, UserRole.OTHER)
    if user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="You do not have permission to create this request.")

    new_request = request_logic.create_request(db, request_data, user.employee_id)
    return {
        "message": "Request to QC Department created successfully.",
        "request": new_request,
    }

# Create a new request From QC Departments (QC Roles)
@router.post("/other")
async def create_request_from_qc(
    request_data: RequestCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Users with role 'chemist', 'shift_chemist', 'qc_manager' or 'admin' can create a request FROM the QC department.

    Responses:
    - 200: Request created successfully
    - 401: Unauthorized access
    - 402: User cannot create this request
    - 403: User does not have permission to create this request
    """
    # 401: Unauthorized access
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized access")
    
    # 402: User cannot create this request because they are not the same employee
    if user.employee_id != request_data.requested_by:
        raise HTTPException(status_code=402, detail="You cannot create a request for another employee.")
    
    # 403: User does not have permission to create this request
    allowed_qc_roles = qc_roles_allowed(UserRole.ADMIN,UserRole.QC_MANAGER,UserRole.SHIFT_CHEMIST,UserRole.CHEMIST)
    if user.role not in allowed_qc_roles:
        raise HTTPException(status_code=403, detail="You do not have permission to create this request.")

    new_request = request_logic.create_request(db, request_data, user.employee_id)
    return {
        "message": "Request to Other Department created successfully.",
        "request": new_request,
    }

# View requests TO the QC team
@router.get("/lab")
async def view_requests_to_qc(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    View requests TO the QC team (Only Chemist, Shift Chemist, QC Manager, and Admin)

    Responses:
    - 200: Requests retrieved successfully
    - 401: Unauthorized access
    - 403: User does not have permission to view requests
    """

    # 401: Unauthorized access
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized access")
    
    # 403: User does not have permission to view requests
    allowed_qc_roles = qc_roles_allowed(UserRole.ADMIN,UserRole.QC_MANAGER,UserRole.SHIFT_CHEMIST,UserRole.CHEMIST)
    if user.role not in allowed_qc_roles:
        raise HTTPException(status_code=403, detail="You do not have permission to view requests.")
    
    requests = request_logic.get_requests_to_qc_team(db)
    return {
        "message": "Requests to QC retrieved successfully." if requests else "No requests found.",
        "total_requests": len(requests),
        "requests": requests
    }

# View requests FROM the QC team
@router.get("/other")
async def view_requests_from_qc(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    View requests FROM the QC team (Only Other Role and Admin)

    Responses:
    - 200: Requests retrieved successfully
    - 401: Unauthorized access
    - 403: User does not have permission to view requests
    """

    # 401: Unauthorized access
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized access")
    
    # 403: User does not have permission to view requests
    allowed_roles = other_roles_allowed(UserRole.ADMIN, UserRole.OTHER)
    if user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="You do not have permission to view requests")

    requests = request_logic.get_requests_from_qc_team(db)
    return {
        "message": "Requests from QC retrieved successfully." 
        if requests else "No requests found.",
        "total_requests": len(requests),
        "requests": requests
    }

# Update request status
@router.put("/{request_id}")
async def update_request_status(
    request_id: UUID,
    request_data: RequestUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Update the status of a request.

    Responses:
    - 200: Request status updated successfully
    - 401: Unauthorized access
    - 403: User does not have permission to update this request
    """
    # 401: Unauthorized access
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized access")
    
    # 403: User does not have permission to update this request
    if user.role not in ["chemist", "shift_chemist", "qc_manager", "admin"]:
        raise HTTPException(status_code=403, detail="You do not have permission to update this request.")

    updated_request = request_logic.update_request(db, request_id, request_data, user.employee_id)
    return {
        "message": "Request status updated successfully.",
        "request": updated_request,
    }

