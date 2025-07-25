from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID

# Database
from app.infrastructure.database import get_db

# Schemas
from app.domain.schemas import SampleCreate, SampleRead, SampleUpdate, UserRead

# Services
from app.services import create_sample_in, get_current_user, sample_logic

# Models
from app.domain.models.sample import Sample

router = APIRouter()

# --- Sample endpoints ---

# Sample create
@router.post("/", response_model=SampleRead, status_code=status.HTTP_201_CREATED)
async def create_sample(
    sample_in: SampleCreate, 
    user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new sample.

    Roles:
    201: User can create samples
    403: User can only create samples to other users
    """
    # 403: User can only create samples to other users
    if sample_in.assigned_to == user.employee_id:
        raise HTTPException(status_code=403, detail="You can only create samples for other users")
    
    # 201: User can create samples
    return create_sample_in(db, sample_in, user)

# List all samples for the current user# List all samples for the current user
@router.get("/", response_model=List[SampleRead])
async def list_samples(
    sample_type: Optional[str] = None,
    user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List samples.
    - Admins: See all samples (with optional category filter).
    - Other users: See only assigned samples (with optional category filter).
    """
    query = db.query(Sample)

    # For admin users: filter by sample_type
    if user.role in {"admin", "qc_manager", "shift_chemist"}:
        if sample_type:
            query = query.filter(Sample.sample_type == sample_type)
        return query.all()
    
    # For non-admin users: filter by assigned_to
    query = query.filter(Sample.assigned_to == user.employee_id)
    if sample_type:
        query = query.filter(Sample.sample_type == sample_type)

    return query.all()


# Latest sample
@router.get("/latest", response_model=SampleRead)
async def get_latest_sample(
    user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the latest sample for the current user.
    
    Responses:
        200: Successful response.
        404: No samples found for the current user.
    """
    latest_sample = sample_logic.get_latest_sample(db, user.employee_id, user)

    
    if latest_sample is None:
        raise HTTPException(status_code=404, detail="No samples found for the current user")
    
    return latest_sample

# Get a sample by Batch Number
@router.get("/{batch_number}", response_model=SampleRead)
def get_sample(
    batch_number: str, 
    user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve a sample by its ID if the user has permission
    
    Responses:
        200: Successful response.
        403: Not authorized to access this sample.
        404: Sample not found.
    """
    sample = sample_logic.get_sample_by_batch_number(db, batch_number)
    if sample is None:
        raise HTTPException(status_code=404, detail="Sample not found")

    if sample.assigned_to != user.employee_id and user.role not in ["admin", "qc_manager"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this sample")
    
    return sample

# Update a sample by Batch Number
@router.put("/{batch_number}", response_model=SampleRead)
async def update_sample(
    batch_number: str,
    sample_in: SampleUpdate,
    user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a sample if the user has permission."""
    sample = sample_logic.get_sample_by_batch_number(db, batch_number)
    if sample is None:
        raise HTTPException(status_code=404, detail="Sample not found")

    # Authorization check (example)
    if sample.assigned_to != user.employee_id and user.role not in ["admin", "qc_manager"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this sample")

    updated = sample_logic.update_sample(db, sample, sample_in)
    return updated

# Delete a sample by ID
@router.delete("/{sample_id}")
async def delete_sample(
    sample_id: UUID,
    user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a sample if the user has permission.
    
    Responses:
        200: Sample deleted successfully
        404: Sample not found or not authorized to delete
        405: Admin or QC Manager can delete any sample
    """
    success = sample_logic.delete_sample(db, sample_id, user.employee_id, user.role.value)
    
    if not success:
        raise HTTPException(status_code=404, detail="Sample not found or not authorized to delete")
    
    return {"detail": "Sample deleted successfully"}
