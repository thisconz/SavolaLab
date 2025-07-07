from pydantic import BaseModel, Field, constr
from uuid import UUID
from typing import Optional

# Enums
from app.domain.models.enums import UserRole

class UserBase(BaseModel):
    """Base schema for user information."""
    employee_id: str = Field(..., example="QC12345", description="Employee unique identifier")
    full_name: str = Field(..., example="Jane Doe", description="Full name of the user")
    role: UserRole = Field(..., description="Role of the user in the system")
    department: str = Field(..., example="QC", description="Department of the user")

    class Config:
        orm_mode = True

class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=6, example="strongpassword", description="User password (min 6 chars)")
class UserLogin(BaseModel):
    """Schema for logging in a user."""
    employee_id: str = Field(..., example="QAZ001", description="Employee ID used to log in")
    password: str = Field(..., example="yourpassword", description="User password")

    class Config:
        orm_mode = True

class UserRead(UserBase):
    """Schema for reading user information."""
    id: UUID = Field(..., example="123e4567-e89b-12d3-a456-426614174000", description="User UUID")
    employee_id: str
    full_name: str
    role: UserRole
    department: str

    class Config:
        orm_mode = True
        use_enum_values = True

class UserUpdate(BaseModel):
    """Schema for updating user information."""
    employee_id: Optional[str] = Field(default=None, example="QC12345", description="Employee unique identifier")
    full_name: Optional[str] = Field(default=None, example="Jane Doe", description="Full name of the user")
    role: Optional[UserRole] = Field(default=None, description="Role of the user in the system")
    password: Optional[str] = Field(default=None, example="newpassword", description="User password (min 6 chars)")
    department: Optional[str] = Field(default=None, example="QC", description="Department of the user")

    class Config:
        orm_mode = True
        use_enum_values = True