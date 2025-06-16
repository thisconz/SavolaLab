from fastapi import Depends
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.infrastructure.database import get_db
from app.services.auth import get_current_user
from app.domain.models import User, Sample
from app.domain.models.enums import SampleType
from app.domain.schemas import SampleCreate, SampleUpdate, UserRead

# --- Samples ---

# Create a new sample
def create_sample_in(
    db: Session,
    sample_in: SampleCreate,
    current_user: UserRead,
) -> Sample:
    sample = Sample(
    sample_type=SampleType(sample_in.sample_type),
    batch_number=sample_in.batch_number,
    collected_at=sample_in.collected_at,
    location=sample_in.location,
    notes_text=sample_in.notes_text,
    assigned_to=sample_in.assigned_to,
    requested_by_id=current_user.id,
)
    db.add(sample)
    db.commit()
    db.refresh(sample)
    return sample

# Update an existing sample
def update_sample(
    db: Session, 
    sample: Sample, 
    sample_in: SampleUpdate
    ) -> Sample:
    for field, value in sample_in.dict(exclude_unset=True).items():
        setattr(sample, field, value)
    db.commit()
    db.refresh(sample)
    return sample

# Get a sample by its ID
def get_sample_by_id(
    db: Session, 
    sample_id: UUID
    ) -> Sample | None:
    return db.query(Sample).filter(Sample.id == sample_id).first()

# Get all samples with pagination
def list_samples(
    db: Session, 
    skip: int = 0, 
    limit: int = 100
    ):
    return db.query(Sample).offset(skip).limit(limit).all()

# Count the total number of samples
def count_samples(db: Session, assigned_to_id: UUID) -> int:
    return db.query(Sample).filter(Sample.assigned_to == assigned_to_id).count()

# Get samples assigned to a specific user by their employee_id
def get_samples_by_user(db: Session, employee_id: str, skip: int = 0, limit: int = 100):
    # Fetch user UUID by employee_id
    user = db.query(User).filter(User.employee_id == employee_id).first()
    if not user:
        return []
    user_uuid = user.id
    return db.query(Sample).filter(Sample.assigned_to == user_uuid).offset(skip).limit(limit).all()

# Delete a sample by its ID
def delete_sample(
    db: Session, 
    sample_id: UUID, 
    employee_id: str) -> bool:
    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        return False
    if sample.assigned_to != db.query(User).filter(User.employee_id == employee_id).first().id:
        return False
    db.delete(sample)
    db.commit()
    return True
