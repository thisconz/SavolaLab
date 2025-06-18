from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.domain.models.enums import SampleType

class SampleBase(BaseModel):
    """Base schema for sample information."""
    sample_type: Optional[SampleType] = Field(None, description="Type of the sample")
    batch_number: Optional[str] = Field(None, example="BATCH202406", description="Batch number of the sample")
    location: Optional[str] = Field(None, example="QC Lab", description="Location where the sample is stored")
    notes_text: Optional[str] = Field(None, example="Handle with care", description="Additional notes about the sample")
    collected_at: Optional[datetime] = Field(None, description="Datetime when the sample was collected")
    assigned_to: Optional[UUID] = Field(None, description="Employee ID assigned to the sample")

    class Config:
        orm_mode = True

class SampleCreate(SampleBase):
    """Schema for creating a new sample."""
    pass

class SampleRead(SampleBase):
    """Schema for reading sample information."""
    id: UUID = Field(..., description="Unique identifier for the sample")
    created_at: datetime = Field(..., description="Datetime when the sample was created")
    updated_at: datetime = Field(..., description="Datetime when the sample was last updated")

    class Config:
        orm_mode = True

class SampleUpdate(BaseModel):
    """Schema for updating sample information."""
    sample_type: Optional[SampleType] = Field(None, description="Type of the sample")
    batch_number: Optional[str] = Field(None, example="BATCH202406", description="Batch number of the sample")
    collected_at: Optional[datetime] = Field(None, description="Datetime when the sample was collected")
    location: Optional[str] = Field(None, example="Lab A", description="Location where the sample is stored")
    notes_text: Optional[str] = Field(None, example="Update notes", description="Additional notes about the sample")

    class Config:
        orm_mode = True