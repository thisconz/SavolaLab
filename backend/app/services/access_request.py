from sqlalchemy.orm import Session
from app.domain.models import AccessRequest, RequestStatus
from app.domain.schemas import AccessRequestCreate

def create_access_request(db: Session, request_data: AccessRequestCreate):
    db_request = AccessRequest(**request_data.dict())
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

def get_all_requests(db: Session):
    return db.query(AccessRequest).order_by(AccessRequest.created_at.desc()).all()

def update_request_status(db: Session, request_id: int, status: RequestStatus):
    req = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not req:
        return None
    req.status = status
    db.commit()
    db.refresh(req)
    return req
