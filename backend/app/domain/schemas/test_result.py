from pydantic import BaseModel, Field, validator
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.domain.models.enums import TestParameter, UnitType, TestStatus

class TestResultBase(BaseModel):
    sample_id: UUID
    parameter: TestParameter
    value: float
    unit: UnitType = Field(..., example="mg/L")
    status: TestStatus = Field(..., example="completed")
    entered_by: str = Field(..., example="QC12345")
    entered_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

class TestResultCreate(TestResultBase):
    pass

class TestResultRead(TestResultBase):
    id: UUID
    notes: Optional[str] = None

    class Config:
        orm_mode = True

class TestResultUpdate(BaseModel):
    parameter: Optional[TestParameter] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    notes: Optional[str] = None
    entered_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        orm_mode = True