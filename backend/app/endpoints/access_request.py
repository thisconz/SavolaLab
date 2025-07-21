from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.domain.schemas import AccessRequestCreate, AccessRequestRead
from app.services import create_access_request, get_all_requests, update_request_status
from app.infrastructure.database import get_db
from typing import List
from app.domain.models import RequestStatus

router = APIRouter()

@router.post("/", response_model=AccessRequestRead, status_code=status.HTTP_201_CREATED)
def request_access(request: AccessRequestCreate, db: Session = Depends(get_db)):
    return create_access_request(db, request)

@router.get("/", response_model=List[AccessRequestRead])
def list_access_requests(db: Session = Depends(get_db)):
    return get_all_requests(db)

@router.put("/{request_id}/status", response_model=AccessRequestRead)
def update_access_status(request_id: int, status: RequestStatus, db: Session = Depends(get_db)):
    updated = update_request_status(db, request_id, status)
    if not updated:
        raise HTTPException(status_code=404, detail="Request not found")
    return updated
