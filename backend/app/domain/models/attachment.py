from sqlalchemy import Column, String, Enum as SqlEnum, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4
from app.domain.base import Base
from app.domain.models.enums import AttachmentTag,  AttachmentType

class SampleAttachment(Base):
    __tablename__ = "attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    sample_id = Column(UUID(as_uuid=True), ForeignKey("samples.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=True)

    tag = Column(
        SqlEnum(
            AttachmentTag,
            native_enum=False,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            create_constraint=True,
        ),
    nullable=True,
    )

    attachment_type = Column(
        SqlEnum(
            AttachmentType,
            native_enum=False,
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            create_constraint=True,
        ),
        nullable=False
    )

    uploaded_by = Column(String, ForeignKey("users.employee_id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    sample = relationship("Sample", back_populates="attachments")
    uploaded_by_user = relationship("User", back_populates="attachments")
