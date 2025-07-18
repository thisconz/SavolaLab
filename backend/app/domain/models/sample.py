from sqlalchemy import Column, String, DateTime, Enum as SqlEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4

from app.domain.base import Base
from app.domain.models.enums import SampleType

class Sample(Base):
    __tablename__ = "samples"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    
    sample_type = Column(
        SqlEnum(
            SampleType,
            native_enum=False,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            create_constraint=True
        ),
        nullable=False
    )
    
    batch_number = Column(String, unique=True, nullable=False)
    collected_at = Column(DateTime, default=datetime.utcnow)
    location = Column(String, nullable=True)
    notes_text = Column(String, nullable=True)
    assigned_to = Column(String, ForeignKey("users.employee_id"), nullable=True)
    requested_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    assigned_user = relationship("User", back_populates="assigned_samples", foreign_keys=[assigned_to])
    test_results = relationship("TestResult", back_populates="sample", cascade="all, delete", foreign_keys="[TestResult.sample_batch_number]")
    attachments = relationship("SampleAttachment", back_populates="sample", cascade="all, delete")