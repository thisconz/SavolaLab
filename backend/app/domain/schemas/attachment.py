from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.domain.models.enums import AttachmentTag, AttachmentType

class AttachmentBase(BaseModel):
    sample_id: UUID
    file_name: str
    file_type: Optional[str] = None
    tag: Optional[AttachmentTag] = None
    attachment_type: Optional[AttachmentType] = None
    uploaded_by: str = Field(..., example="QC12345")
    uploaded_at: Optional[datetime] = None

class AttachmentCreate(AttachmentBase):
    pass

class AttachmentRead(AttachmentBase):
    id: UUID
    file_url: Optional[str] = None

    class Config:
        orm_mode = True
