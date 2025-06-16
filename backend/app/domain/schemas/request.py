from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.domain.models.enums import RequestStatus, RequestType

class RequestBase(BaseModel):
    sample_id: UUID
    requested_by: str = Field(..., example="QC12345", description="Employee unique identifier of the requester")
    status: Optional[RequestStatus] = Field(..., description="Status of the request (e.g., pending, approved, rejected)")
    type: Optional[RequestType] = Field(..., description="Type of the request (e.g., sample analysis, equipment maintenance)")
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow, description="Timestamp when the request was created")
    request_type: RequestType = Field(..., description="Type of the request (e.g., sample analysis, equipment maintenance)")

    class Config:
        orm_mode = True
        use_enum_values = True

class RequestCreate(RequestBase):
    pass

class RequestRead(RequestBase):
    id: UUID = Field(..., description="Unique identifier for the request")

    class Config:
        orm_mode = True
        use_enum_values = True

class RequestUpdate(BaseModel):
    sample_id: Optional[UUID] = Field(default=None, description="Sample ID associated with the request")

    class Config:
        orm_mode = True
        use_enum_values = True