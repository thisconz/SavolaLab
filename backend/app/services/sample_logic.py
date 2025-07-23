from sqlalchemy import func, Integer
from sqlalchemy.orm import Session
from uuid import UUID

# Models
from app.domain.models import User, Sample

# Enums
from app.domain.models.enums import SampleType, UserRole

# Schemas
from app.domain.schemas import SampleCreate, SampleUpdate, UserRead

# --- Samples ---

# Create a new sample
def create_sample_in(db: Session, sample_in: SampleCreate, current_user: UserRead) -> Sample:
    batch_number = auto_create_sample_batch_number(db, SampleType(sample_in.sample_type))
    
    # Create a new sample
    sample = Sample(
        sample_type=SampleType(sample_in.sample_type),
        batch_number=batch_number,
        collected_at=sample_in.collected_at,
        location=sample_in.location,
        notes_text=sample_in.notes_text,
        assigned_to=sample_in.assigned_to,
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

# Delete a sample by its ID
def delete_sample(
    db: Session, 
    sample_id: UUID, 
    employee_id: str,
    user_role: UserRole
) -> bool:
    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        return False
    
    # Allow admin or qc_manager to delete any sample
    if user_role in ["admin", "qc_manager"] or sample.assigned_to == employee_id:
        db.delete(sample)
        db.commit()
        return True
    
    # Otherwise, only assigned user can delete
    if sample.assigned_to == employee_id:
        db.delete(sample)
        db.commit()
        return True
    
    return False

# Check if a user can access a sample
def user_can_access_sample(user: User, sample: Sample) -> bool: 
    return user.role in [UserRole.CHEMIST, UserRole.SHIFT_CHEMIST, UserRole.QC_MANAGER, UserRole.ADMIN] and sample.assigned_to == user.employee_id

# Get a sample by its ID
def get_sample_by_batch_number(db: Session, batch_number: str ) -> Sample | None:
    return db.query(Sample).filter(Sample.batch_number == batch_number).first()
# Get samples assigned to a specific user by their employee_id
def get_samples_by_user(db: Session, employee_id: str, skip: int = 0, limit: int = 100):
    return db.query(Sample).filter(Sample.assigned_to == employee_id).offset(skip).limit(limit).all()
# Get all samples
def get_all_samples(db: Session):
    return db.query(Sample).all()
# Get all samples with pagination
def list_samples(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Sample).offset(skip).limit(limit).all()
# Get the latest samples
def get_latest_sample(db: Session, employee_id: str, user) -> Sample | None:
    if user.role in {"admin", "qc_manager", "shift_chemist"}:
        return db.query(Sample).first()
    return db.query(Sample).filter(Sample.assigned_to == employee_id).order_by(Sample.collected_at.desc()).first()

# Count the total number of samples
def count_samples(db: Session, user) -> int:
    if user.role in {"admin", "qc_manager", "shift_chemist"}:
        return db.query(Sample).count()
    return db.query(Sample).filter(Sample.assigned_to == user.employee_id).count()

# --- Sample batch number prefixes ---
# Define prefixes for sample types
PREFIXES = {
    "white_sugar": "W",
    "brown_sugar": "B",
    "raw_sugar": "R",
    "fine_liquor": "F",
    "polish_liquor": "P",
    "evaporator_liquor": "E",
    "sat_out": "S",
    "condensate": "C",
    "cooling_water": "L",
    "wash_water": "WW",
}

# Auto create a sample batch number
def auto_create_sample_batch_number(db: Session, sample_type: SampleType, max_retries=5) -> str:
    prefix = PREFIXES.get(sample_type.value, "X")
    for _ in range(max_retries):
        max_suffix = (
            db.query(func.max(func.cast(func.substr(Sample.batch_number, len(prefix) + 1), Integer)))
            .filter(Sample.batch_number.like(f"{prefix}%"))
            .scalar()
        )
        next_suffix = (max_suffix or 0) + 1
        batch_number = f"{prefix}{next_suffix:03d}"

        exists = db.query(Sample).filter(Sample.batch_number == batch_number).first()
        if not exists:
            return batch_number

    raise Exception("Failed to generate a unique batch number after multiple retries")
