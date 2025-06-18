from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.services import request_logic
from app.services import get_current_user
from app.infrastructure.database import get_db
from app.domain.models.user import User

router = APIRouter()

# Create a new request to the QC Department ( Only the user role Other )
@router.post("/lab")
async def create_request(
    request_data: dict,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    ):
    """
    Create a new request to the QC Department.
    """
    # Create the new request
    new_request = request_logic.create_request(db, request_data, user.employee_id)

    if user.role in ['other', "admin"]:
        return new_request, {"message": "Request to QC Department created successfully."}
    else:
        return {"message": "You do not have permission to create this request."}

# Create a new request to Other Departments (Only QC Roles)
@router.post("/other")
async def create_other_request(
    request_data: dict,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
    ):
    """
    Create a new request to Other Departments.
    """
    # Create the new request
    new_request = request_logic.create_request(db, request_data, user.employee_id)
    
    if user.role in ["chemist", "shift_chemist", "qc_manager", "admin"]:
        return new_request, {"message": "Request to other department created successfully."}
    else:
        return {"message": "You do not have permission to create this request."}

# Requests to QC Department
@router.get("/other")
async def get_requests(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Retrieve requests made by other users to the chemist or shift chemist or qc manager.
    """
    # Retrieve requests made by the user
    requests = request_logic.get_requests_by_employee_id(db, user.employee_id)

    if not requests:
        return {
            "message": "No requests found for the user.",
            "total_requests": 0,
            "requests": []
        }

    return {
        "requests": requests,
        "total_requests": len(requests),
        "message": "Requests retrieved successfully." if requests else "No requests found for the user."
    }

# Requests from QC Department
@router.get("/lab")
async def get_lab_requests(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Retrieve requests made by the chemist or shift chemist or qc manager.
    """
    lab_requests = request_logic.get_requests_by_employee_id(db, user.employee_id)

    if not lab_requests:
        return {
            "message": "No lab requests found for the user.",
            "total_requests": 0,
            "requests": []
        }

    return {
        "requests": lab_requests,
        "total_requests": len(lab_requests),
        "message": "Lab requests retrieved successfully." if lab_requests else "No lab requests found for the user."
    }
