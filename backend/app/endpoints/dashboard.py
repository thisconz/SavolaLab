from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# Services
from app.services import sample_logic, test_logic, get_current_user

# Database
from app.infrastructure.database import get_db

# Models
from app.domain.models.user import User

router = APIRouter()

# --- Dashboard Endpoints ---

# Get dashboard data ( List all samples and tests for the current user )
@router.get("/")
async def get_dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    ):
    """
    Retrieve samples and tests for the current user.

    Responses:
        200: Successful response.
        401: Unauthorized access.
        402: Admin and QC Manager roles can view all samples and tests.
    """
    # 401: Unauthorized access
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized access")
    
    # 402: Admin and QC Manager roles can view all samples and tests
    if user.role in ["admin", "qc_manager"]:
        samples = sample_logic.get_all_samples(db)
        tests = test_logic.get_all_test_results(db)
    else:
        samples = sample_logic.get_samples_by_user(db, user.employee_id)
        tests = test_logic.get_tests_by_user(db, user.employee_id)
    
    if not samples and not tests:
        return {
            "message": "No samples or tests found for the user.",
            "total_samples": 0,
            "latest_sample": None,
            "total_tests": 0,
            "average_test_results": 0,
            "latest_test": None,
        }
    # Sort samples by created_at descending
    samples.sort(key=lambda x: x.created_at, reverse=True)

    # Sort tests by entered_at descending
    tests.sort(key=lambda x: x.entered_at, reverse=True)

    # Take top 100 samples and tests
    samples = samples[:100]
    tests = tests[:100]

    # Filter tests based on sample IDs
    sample_batch_numbers = {sample.batch_number for sample in samples}
    tests = [test for test in tests if test.sample_batch_number in sample_batch_numbers]

    # This could include counts, averages, and latest entries
    return {
        "total_samples": len(samples),
        "samples": samples,
        "latest_sample": samples[0] if samples else None,
        "total_tests": len(tests),
        "tests": tests,
        "average_test_results": sum(test.value for test in tests) / len(tests) if tests else 0,
        "latest_test": tests[0] if tests else None,
    }

# Get dashboard summary ( Summary of samples and tests for the current user )
@router.get("/summary")
async def get_dashboard_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    ):
    """Retrieve a summary of the dashboard for the current user.
    This endpoint aggregates data from samples and tests to provide a summary
    of the user's activity and statistics.
    """
    samples_count = sample_logic.count_samples(db, user)
    tests_count = test_logic.count_tests(db, user.employee_id)  

    # Check if there are samples or tests for the user
    if not samples_count and not tests_count:
        return {
            "message": "No samples or tests found for the user.",
            "samples_count": 0,
            "tests_count": 0,
        }

    return {
        "samples_count": samples_count,
        "tests_count": tests_count,
        "message": "Dashboard summary retrieved successfully."
    }

