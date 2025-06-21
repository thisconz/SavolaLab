from sqlalchemy import Column, Float, String, Enum as SqlEnum, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4

from app.domain.base import Base
from app.domain.models.enums import TestParameter, UnitType, TestStatus

class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    sample_batch_number = Column(String, ForeignKey("samples.batch_number"), nullable=False)
    
    parameter = Column(
        SqlEnum(
            TestParameter,
            native_enum=False,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            create_constraint=True,
        ),
        nullable=False
    )
    
    value = Column(Float, nullable=False)

    status = Column(
        SqlEnum(
            TestStatus,
            native_enum=False,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            create_constraint=True,
        ),
        nullable=False
    )

    unit = Column(
        SqlEnum(
            UnitType,
            native_enum=False,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            create_constraint=True,
        ),
        nullable=True
    )

    notes = Column(String, nullable=True)
    entered_by = Column(String, ForeignKey("users.employee_id"), nullable=False)
    entered_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sample = relationship("Sample", back_populates="test_results", foreign_keys=[sample_batch_number])
    entered_by_user = relationship("User", back_populates="test_results")
