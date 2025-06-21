from sqlalchemy import Column, String, Enum as SqlEnum
from uuid import uuid4
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.domain.base import Base
from app.domain.models.enums import UserRole

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    password = Column(String, nullable=False)
    role = Column(
        SqlEnum(
            UserRole,
            name="userrole",
            native_enum=False,
            values_callable=lambda x: [e.value for e in x],
            create_constraint=True,
        ),
        nullable=False,
    )

    assigned_samples = relationship(
        "Sample",
        back_populates="assigned_user",
        primaryjoin="User.employee_id == Sample.assigned_to"
    )

    sample_requests = relationship(
        "Sample",
        back_populates="requested_by_user",
        foreign_keys="[Sample.requested_by_id]"
    )

    test_results = relationship("TestResult", back_populates="entered_by_user")
    attachments = relationship("SampleAttachment", back_populates="uploaded_by_user")
    requests = relationship("Request", back_populates="requested_by_user")
