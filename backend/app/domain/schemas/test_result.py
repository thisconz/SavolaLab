from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

# Enums 
from app.domain.models.enums import TestParameter, UnitType, TestStatus

class TestResultBase(BaseModel):
    sample_batch_number: str
    parameter: TestParameter
    value: float
    unit: UnitType = Field(..., example="mg/L")
    status: TestStatus = Field(..., example="completed")
    entered_by: str = Field(..., example="QAZ001")
    entered_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

class TestResultCreate(TestResultBase):
    pass

class TestResultRead(TestResultBase):
    id: UUID
    sample_batch_number: str
    notes: Optional[str] = None

    class Config:
        orm_mode = True

class TestResultUpdate(BaseModel):
    parameter: Optional[TestParameter] = None
    value: Optional[float] = None
    unit: Optional[UnitType] = None
    notes: Optional[str] = None
    entered_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        orm_mode = True