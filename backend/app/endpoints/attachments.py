from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

# Services
from app.services import (
    save_attachment,
    delete_attachment,
    get_attachment_by_id,
    get_attachment_url,
)

# Models
from app.domain.models import User, Sample

# Schemas
from app.domain.schemas import AttachmentRead

## Database
from app.infrastructure.database import get_db

# Dependencies
from app.endpoints._deps import allowed_qc_roles

router = APIRouter()

# --- Attachment endpoints ---

# Upload attachment to a sample batch number
@router.post("/{sample_batch_number}/upload", response_model=AttachmentRead)
def upload_sample_attachment(
    sample_batch_number: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(allowed_qc_roles),
):
    """
    Upload an attachment to a sample.
    """
    sample = db.query(Sample).filter(Sample.batch_number == sample_batch_number).first()
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    return save_attachment(file=file, db=db, sample_id=sample.id, employee_id=user.employee_id)

# Get attachment URL by ID
@router.get("/{attachment_id}", response_model=AttachmentRead)
def read_attachment(
    attachment_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(allowed_qc_roles),
):
    """
    Read metadata for an attachment.
    """
    attachment = get_attachment_by_id(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return attachment

# Delete attachment by ID
@router.delete("/{attachment_id}")
def delete_sample_attachment(
    attachment_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(allowed_qc_roles),
):

    """
    Delete an attachment from a sample.
    """
    attachment = get_attachment_by_id(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    delete_attachment(
        key=attachment.file_name,
        db=db,
        sample_id=attachment.sample_id,
        employee_id=user.employee_id,
    )
    return {"detail": "Attachment deleted successfully"}

# Get an attachment download URL
@router.get("/{attachment_id}/url", response_model=str)
def get_attachment_download_url(
    attachment_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(allowed_qc_roles),
):
    """
    Get the download URL for an attachment.
    """
    attachment = get_attachment_by_id(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return get_attachment_url(attachment.file_name)
