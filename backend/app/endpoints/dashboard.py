from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.services import sample_logic, test_logic, get_current_user
from app.infrastructure.database import get_db
from app.domain.models.user import User

router = APIRouter()

# Dashboard Endpoints
@router.get("/")
async def get_dashboard(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
    ):
    """
    Retrieve samples and tests for the current user.
    Returns:
        dict: A dictionary containing samples and tests for the dashboard.
    """
    samples = sample_logic.get_samples_by_user(db, user.employee_id)
    tests = test_logic.get_tests_by_user(db, user.employee_id)
    if not samples and not tests:
        return {
            "message": "No samples or tests found for the user.",
            "total_samples": 0,
            "total_tests": 0,
            "average_test_results": 0,
            "latest_sample": None,
            "latest_test": None,
        }
    # Calculate additional statistics as needed
    samples.sort(key=lambda x: x.created_at, reverse=True)
    tests.sort(key=lambda x: x.created_at, reverse=True)

    # Ensure we have the latest sample and test
    if samples:
        samples = samples[:10]
    if tests:
        tests = tests[:10]
    tests = [test for test in tests if test.sample_id in [sample.id for sample in samples]]

    # Aggregate data for the dashboard
    # This could include counts, averages, and latest entries
    return {
        "samples": samples,
        "tests": tests,
        "total_samples": len(samples),
        "total_tests": len(tests),
        "average_test_results": sum(test.result for test in tests) / len(tests) if tests else 0,
        "latest_sample": samples[-1] if samples else None,
        "latest_test": tests[-1] if tests else None,
    }

# This endpoint provides a summary of the dashboard, such as counts of samples and tests.
@router.get("/summary")
async def get_dashboard_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    ):
    """Retrieve a summary of the dashboard for the current user.
    This endpoint aggregates data from samples and tests to provide a summary
    of the user's activity and statistics.
    Returns:
        dict: A dictionary containing aggregated data for the dashboard summary.
    """
    samples_count = sample_logic.count_samples(db, user.id)
    tests_count = test_logic.count_tests(db, user.employee_id)  

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

