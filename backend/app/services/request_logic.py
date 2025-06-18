from sqlalchemy.orm import Session
from uuid import UUID

from app.domain.models.request import Request
from app.domain.schemas.request import RequestCreate, RequestUpdate

# --- Requests ---

# Get request by Employee ID
def get_requests_by_employee_id(
    db: Session, 
    employee_id: str):
    return db.query(Request).filter(Request.requested_by == employee_id).all()

# Create a new request
def create_request(
    db: Session, 
    request_data: dict, 
    created_by_employee_id: str
):
    request_data["requested_by"] = created_by_employee_id
    new_request = Request(**request_data)
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

# Update an existing request
def update_request(
    db: Session, 
    request_id: int, 
    update_data: dict
):
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        return None
    for key, value in update_data.items():
        setattr(request, key, value)
    db.commit()
    db.refresh(request)
    return request

# Cancel a request (update status to 'canceled')
def cancel_request(
    db: Session, 
    request_id: int):
    request = db.query(Request).filter(Request.id == request_id).first()
    if not request:
        return None
    request.status = 'canceled'
    db.commit()
    db.refresh(request)
    return request

# Get request by request ID
def get_request_by_id(
    db: Session, 
    request_id: int):
    return db.query(Request).filter(Request.id == request_id).first()