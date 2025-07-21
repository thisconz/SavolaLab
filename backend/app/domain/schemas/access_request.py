from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.domain.models.enums import RequestStatus

class AccessRequestBase(BaseModel):
    full_name: str
    email: EmailStr
    employee_id: str
    reason: str | None = None

class AccessRequestCreate(AccessRequestBase):
    pass

class AccessRequestRead(AccessRequestBase):
    id: int
    status: RequestStatus
    created_at: datetime

    class Config:
        orm_mode = True
