from sqlalchemy.orm import Session
from datetime import datetime
from uuid import UUID

from app.domain.models import User
from app.domain.models import Sample
from app.domain.models.test_result import TestResult
from app.domain.schemas.test_result import TestResultCreate, TestResultUpdate
from app.domain.models.enums import UserRole

# Create a new test result
def create_test_result(
    db: Session, 
    test_in: TestResultCreate, 
    created_by_employee_id: str) -> TestResult:
    test_result = TestResult(
        sample_id=test_in.sample_id,
        parameter=test_in.parameter.value.lower(),
        value=test_in.value,
        unit=test_in.unit,
        notes=test_in.notes,
        entered_by=created_by_employee_id,
        entered_at=test_in.entered_at or datetime.utcnow()
    )
    db.add(test_result)
    db.commit()
    db.refresh(test_result)
    return test_result

# Update a test result
def update_test_result(db: Session, test_result: TestResult, test_in: TestResultUpdate) -> TestResult:
    for field, value in test_in.dict(exclude_unset=True).items():
        setattr(test_result, field, value)
    db.commit()
    db.refresh(test_result)
    return test_result

# Delete a test result
def delete_test_result(db: Session, test_result: TestResult) -> None:
    db.delete(test_result)
    db.commit()




# Get a test result or sample by ID
def get_tests_by_user(db: Session, employee_id: str) -> list[TestResult]:
    return db.query(TestResult).filter(TestResult.entered_by == employee_id).all()
def get_test_result_by_id(db: Session, test_result_id: int) -> TestResult | None:
    return db.query(TestResult).filter(TestResult.id == test_result_id).first()
def get_sample_by_id(db: Session, sample_id: UUID) -> Sample | None:
    return db.query(Sample).filter(Sample.id == sample_id).first()
def get_test_results_by_sample(db: Session, sample_id: UUID) -> list[TestResult]:
    return db.query(TestResult).filter(TestResult.sample_id == sample_id).all()

# User can access test or sample if they are the owner or have the appropriate role
def user_can_access_test(user, test):
    return user.role in [UserRole.CHEMIST, UserRole.SHIFT_CHEMIST, UserRole.QC_MANAGER, UserRole.ADMIN]
def user_can_access_test_result(user, test_result):
    return user.role in [UserRole.CHEMIST, UserRole.SHIFT_CHEMIST, UserRole.QC_MANAGER, UserRole.ADMIN]
def user_can_access_sample(user, sample):
    return user.role in [UserRole.CHEMIST, UserRole.SHIFT_CHEMIST, UserRole.QC_MANAGER, UserRole.ADMIN]

# Get all test results for a sample
def list_test_results(db: Session, skip: int = 0, limit: int = 100):
    return db.query(TestResult).offset(skip).limit(limit).all()

# Check if a user can create a test result
def user_can_create_test_result(user: User) -> bool:
    return user.role in [UserRole.CHEMIST, UserRole.SHIFT_CHEMIST, UserRole.QC_MANAGER, UserRole.ADMIN]

# Check if a test result exists
def test_result_exists(db: Session, test_result_id: int) -> bool:
    return db.query(TestResult).filter(TestResult.id == test_result_id).first() is not None

# Count the number of test results
def count_tests(db: Session, employee_id: str) -> int:
    return db.query(TestResult).filter(TestResult.entered_by == employee_id).count()
    