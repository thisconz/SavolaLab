from sqlalchemy import Column, String, DateTime, Enum as SqlEnum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from uuid import uuid4

from app.domain.models.enums import RequestStatus
from app.domain.base import Base

class AccessRequest(Base):
    __tablename__ = "access_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    employee_id = Column(String, nullable=False, unique=True)
    reason = Column(String, nullable=True)

    status = Column(
        SqlEnum(
            RequestStatus, 
            native_enum=False,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            create_constraint=True,
            ), 
    default=RequestStatus.PENDING,
    nullable=False
    )

    created_at = Column(DateTime, default=datetime.utcnow)