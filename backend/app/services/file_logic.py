from fastapi import UploadFile
from sqlalchemy.orm import Session
from io import BytesIO
from uuid import UUID
from uuid import uuid4

from app.infrastructure.config import settings
from app.infrastructure.s3_client import upload_file, delete_file, generate_presigned_url
from app.domain.models import SampleAttachment
from app.domain.models.enums import AttachmentType, AttachmentTag

# --- MinIO ---

# S3 Configuration
S3_ENDPOINT_URL = settings.S3_ENDPOINT_URL
S3_BUCKET_NAME = settings.S3_BUCKET_NAME

# --- Attachments ---

# Save Attachment
def save_attachment(
    file: UploadFile,
    db: Session,
    sample_id: UUID,
    employee_id: str,
) -> SampleAttachment:

    file_extension = file.filename.split(".")[-1]
    key = f"{uuid4()}.{file_extension}"

    file_content = file.file.read()
    file.file.seek(0)

    # Wrap content in a file-like object for upload_fileobj
    file_like = BytesIO(file_content)

    # Upload to MinIO (S3-compatible)
    upload_file(file_like, key, file.content_type)  # ← file_like instead of raw bytes

    # Infer attachment_type
    content_type = file.content_type.lower()
    if "pdf" in content_type:
        attachment_type = AttachmentType.PDF
    elif "image" in content_type:
        attachment_type = AttachmentType.IMAGE
    elif "doc" in content_type or "word" in content_type:
        attachment_type = AttachmentType.DOCUMENT
    else:
        attachment_type = AttachmentType.OTHER

    # Optional fallback for tag
    tag = AttachmentTag.OTHER

    attachment = SampleAttachment(
        sample_id=sample_id,
        file_name=key,
        file_type=file.content_type,
        uploaded_by=employee_id,
        attachment_type=attachment_type,
        tag=tag,
    )

    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return attachment

# Delete Attachment 
def delete_attachment(
    key: str,
    db: Session,
    sample_id: UUID,
    employee_id: str,
) -> None:
    db.query(SampleAttachment).filter(
        SampleAttachment.sample_id == sample_id,
        SampleAttachment.file_name == key,
        SampleAttachment.uploaded_by == employee_id,
    ).delete()
    db.commit()
    delete_file(key)

# Get attachment by ID
def get_attachment_by_id(
    db: Session,
    attachment_id: UUID,
) -> SampleAttachment | None:
    return db.query(SampleAttachment).filter(SampleAttachment.id == attachment_id).first()

# Get attachment download URL
def get_attachment_url(key: str) -> str:
    return generate_presigned_url(key)