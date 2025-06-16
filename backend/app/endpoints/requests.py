from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.services import request_logic
from app.services import get_current_user
from app.infrastructure.database import get_db
from app.domain.models.user import User

router = APIRouter()

# Requests from other users to chemist or shift chemist or qc manager to test the sample
@router.get("/other")
async def get_requests(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
    
):
    """
    Retrieve requests made by other users to the chemist, shift chemist, or QC manager.

    This endpoint aggregates data from requests to provide a summary of the user's activity and statistics.

    Returns:
        dict: A dictionary containing aggregated data for the requests.
    """
    # Fetch requests made by other users
    requests = request_logic.get_requests_by_user(db, user.employee_id)
    
    if not requests:
        return {
            "message": "No requests found for the user.",
            "total_requests": 0,
            "requests": []
        }
    
    # Aggregate data for the requests
    return {
        "requests": requests,
        "total_requests": len(requests),
        "message": "Requests retrieved successfully."
    }

# Endpoint to get requests made by the chemist or shift chemist or qc manager
@router.get("/lab")
async def get_lab_requests(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Retrieve requests made by the chemist, shift chemist, or QC manager.

    This endpoint aggregates data from requests to provide a summary of the user's activity and statistics.

    Returns:
        dict: A dictionary containing aggregated data for the lab requests.
    """
    # Fetch lab requests made by the chemist, shift chemist, or QC manager
    lab_requests = request_logic.get_lab_requests_by_user(db, user.employee_id)
    
    if not lab_requests:
        return {
            "message": "No lab requests found for the user.",
            "total_requests": 0,
            "requests": []
        }
    
    # Aggregate data for the lab requests
    return {
        "requests": lab_requests,
        "total_requests": len(lab_requests),
        "message": "Lab requests retrieved successfully."
    }
