from sqlalchemy import Column, String, Enum as SqlEnum, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4

from app.domain.base import Base
from app.domain.models.enums import RequestStatus, RequestType

class Request(Base):
    __tablename__ = "requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    sample_batch_number = Column(String, ForeignKey("samples.batch_number"), nullable=False)

    target_department = Column(String, nullable=True, index=True)
    source_department = Column(String, nullable=True, index=True)

    requested_by = Column(String, ForeignKey("users.employee_id"), nullable=False)

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
    
    type = Column(
        SqlEnum(
            RequestType,
            native_enum=False,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            create_constraint=True,
        ),
        nullable=False
    )

    created_at = Column(DateTime, default=datetime.utcnow)

    sample = relationship("Sample", back_populates="requests", primaryjoin="Request.sample_batch_number == Sample.batch_number", foreign_keys=[sample_batch_number])
    requested_by_user = relationship("User", back_populates="requests", foreign_keys=[requested_by])
