from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.services import request_logic
from app.services import get_current_user
from app.infrastructure.database import get_db
from app.domain.models.user import User
from app.domain.schemas.request import RequestCreate

router = APIRouter()

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
    if user.role not in ["other", "admin"]:
        raise HTTPException(status_code=403, detail="You do not have permission to create this request.")

    new_request = request_logic.create_request(db, request_data, user.employee_id)
    return {
        "message": "Request to QC Department created successfully.",
        "request": new_request,
    }

# Create a new request From QC Departments (QC Roles)
@router.post("/other")
async def create_request_to_other(
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
    if user.role not in ["chemist", "shift_chemist", "qc_manager", "admin"]:
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
    if user.role not in ["chemist", "shift_chemist", "qc_manager", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
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
    if user.role not in ["other", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    requests = request_logic.get_requests_from_qc_team(db)
    return {
        "message": "Requests from QC retrieved successfully." 
        if requests else "No requests found.",
        "total_requests": len(requests),
        "requests": requests
    }