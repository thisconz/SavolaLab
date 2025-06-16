from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from uuid import UUID

from app.infrastructure.database import get_db
from app.domain.schemas import SampleCreate, SampleRead, SampleUpdate
from app.services import create_sample_in
from app.services import get_current_user
from app.services import sample_logic
from app.domain.schemas import UserRead

router = APIRouter()

# Sample Endpoints
@router.post("/", response_model=SampleRead, status_code=status.HTTP_201_CREATED)
async def create_sample(
    sample_in: SampleCreate, 
    user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new sample."""
    return create_sample_in(db, sample_in, user)

# List all samples for the current user
@router.get("/", response_model=List[SampleRead])
async def list_samples(
    user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db)
    ):
    return sample_logic.get_samples_by_user(db, user.employee_id)

# Retrieve a sample by ID
@router.get("/{sample_id}", response_model=SampleRead)
def get_sample(
    sample_id: UUID, 
    user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve a sample by its ID if the user has permission."""
    sample = sample_logic.get_sample_by_id(db, sample_id)
    if sample is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    if sample.assigned_to != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this sample")
    return sample

# Update a sample by ID
@router.put("/{sample_id}", response_model=SampleRead)
async def update_sample(
    sample_id: UUID,
    sample_in: SampleUpdate,
    user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a sample if the user has permission."""
    sample = sample_logic.get_sample_by_id(db, sample_id)
    if sample is None:
        raise HTTPException(status_code=404, detail="Sample not found")

    # Authorization check (example)
    if sample.assigned_to != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this sample")

    updated = sample_logic.update_sample(db, sample, sample_in)
    return updated

# Delete a sample by ID
@router.delete("/{sample_id}")
async def delete_sample(
    sample_id: UUID,
    user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a sample if the user has permission."""
    success = sample_logic.delete_sample(db, sample_id, user.employee_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sample not found or not authorized to delete")
    return {"detail": "Sample deleted successfully"}