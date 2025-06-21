from sqlalchemy.orm import Session
from uuid import UUID

from app.domain.models.request import Request
from app.domain.schemas.request import RequestCreate, RequestUpdate

# --- Requests ---

# Get request by Employee ID

# Requests created by a user
def get_requests_created_by_user(db: Session, employee_id: str):
    return db.query(Request).filter(Request.requested_by == employee_id).all()

# Requests TO the QC team
def get_requests_to_qc_team(db: Session):
    return db.query(Request).filter(Request.target_department == "qc").all()

# Requests FROM the QC team
def get_requests_from_qc_team(db: Session):
    return db.query(Request).filter(Request.source_department == "qc").all()

# Create a new request
def create_request(db: Session, request_data: RequestCreate, created_by_employee_id: str):
    obj_data = request_data.dict()
    obj_data["requested_by"] = created_by_employee_id
    new_request = Request(**obj_data)
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

# Update an existing request
def update_request(db: Session, request_id: UUID, update_data: dict):
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
    request_id: UUID):
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
    request_id: UUID):
    return db.query(Request).filter(Request.id == request_id).first()