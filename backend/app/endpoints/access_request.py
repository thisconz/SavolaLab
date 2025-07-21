from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.domain.schemas import AccessRequestCreate, AccessRequestRead
from app.domain.schemas.user import UserRead
from app.services import create_access_request, get_all_requests, update_request_status
from app.infrastructure.database import get_db
from typing import List
from app.domain.models import RequestStatus
from app.endpoints._deps import admin_or_qc_manager

router = APIRouter()

# Define the endpoint for requesting access
@router.post("/", response_model=AccessRequestRead, status_code=status.HTTP_201_CREATED)
def request_access(request: AccessRequestCreate, db: Session = Depends(get_db)):
    return create_access_request(db, request)

# Define the endpoint for listing all access requests
def list_access_requests(user: UserRead = Depends(admin_or_qc_manager), db: Session = Depends(get_db)):
    """List all access requests.
    Only accessible by admin or QC manager."""
    return get_all_requests(db)

# Define the endpoint for updating the status of an access request
@router.put("/{request_id}/status", response_model=AccessRequestRead)
def update_access_status(request_id: int, status: RequestStatus, user: UserRead = Depends(admin_or_qc_manager), db: Session = Depends(get_db)):
    """Update the status of an access request.
    Only accessible by admin or QC manager."""
    if not user:
        raise HTTPException(status_code=403, detail="Access denied")
    result = update_request_status(db, request_id, status)
    if not result:
        raise HTTPException(status_code=404, detail="Access request not found")
    return result
