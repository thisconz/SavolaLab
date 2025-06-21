from sqlalchemy.orm import Session
from datetime import datetime
from uuid import UUID

# Models
from app.domain.models import User, Sample, TestResult

# Schemas
from app.domain.schemas.test_result import TestResultCreate, TestResultUpdate

# Enums
from app.domain.models.enums import UserRole

# Create a new test result
def create_test_result(
    db: Session, 
    test_in: TestResultCreate, 
    created_by_employee_id: str) -> TestResult:
    test_result = TestResult(
        sample_batch_number=test_in.sample_batch_number,
        parameter=test_in.parameter.value.lower(),
        value=test_in.value,
        unit=test_in.unit,
        status=test_in.status.value.lower(),
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

# Get a test result

# By user
def get_tests_by_user(db: Session,employee_id: str,skip: int = 0,limit: int = 100) -> list[TestResult]:
    return (db.query(TestResult).filter(TestResult.entered_by == employee_id).order_by(TestResult.entered_at.desc()).offset(skip).limit(limit).all())
# By test result ID
def get_test_result_by_id(db: Session, test_result_id: UUID) -> TestResult | None:
    return db.query(TestResult).filter(TestResult.id == test_result_id).first()
# By sample ID
def get_sample_by_id(db: Session, sample_id: UUID) -> Sample | None:
    return db.query(Sample).filter(Sample.id == sample_id).first()
# By sample batch number
def get_test_results_by_sample_batch_number(db: Session, sample_batch_number: str) -> list[TestResult]:
    return db.query(TestResult).filter(TestResult.sample_batch_number == sample_batch_number).all()
# all test results
def get_all_tests(db: Session):
    return db.query(TestResult).all()

# User can access a Test result
def user_can_access_test_result(user: User, test: TestResult) -> bool: 
    return user.role in [UserRole.CHEMIST, UserRole.SHIFT_CHEMIST, UserRole.QC_MANAGER, UserRole.ADMIN] and test.entered_by == user.employee_id

# Check if a user can create a test result for a sample
def user_can_create_test_result_for_sample(user: User, sample: Sample) -> bool:
    return user.role in [UserRole.CHEMIST, UserRole.SHIFT_CHEMIST, UserRole.QC_MANAGER, UserRole.ADMIN]

# Check if a test result is valid
def is_valid_test_result(test_result: TestResult) -> bool:
    return test_result.value is not None and test_result.unit is not None and test_result.status is not None

# Count the number of test results
def count_tests(db: Session, employee_id: str) -> int:
    return db.query(TestResult).filter(TestResult.entered_by == employee_id).count()
