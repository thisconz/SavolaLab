from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

# Schemas
from app.domain.schemas import TestResultCreate, TestResultRead

# Services
from app.services import test_logic, sample_logic, get_current_user

# Database
from app.infrastructure.database import get_db

router = APIRouter()

# --- Test Endpoints ---

# Create a new test result
@router.post("/", response_model=TestResultRead, status_code=201)
async def create_test_result(
    test_in: TestResultCreate, 
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new test result."""
    sample = sample_logic.get_sample_by_batch_number(db, test_in.sample_batch_number)

    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized access")
    
    if not test_logic.user_can_create_test_result_for_sample(user, sample):
        raise HTTPException(status_code=403, detail="Not authorized to create a test result")
    
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    existing_results = test_logic.get_test_results_by_sample_batch_number(db, test_in.sample_batch_number)
    if any(r.parameter == test_in.parameter.value.lower() for r in existing_results):
        raise HTTPException(status_code=409, detail="Test result for this parameter already exists")
    
    if not test_logic.is_valid_test_result(test_in):
        raise HTTPException(status_code=410, detail="Invalid test result data")
    
    if not test_logic.user_can_create_test_result_for_sample(user, sample):
        raise HTTPException(status_code=413, detail="User cannot create test results on this sample")
    
    test_result = test_logic.create_test_result(db, test_in, user.employee_id)
    return TestResultRead.from_orm(test_result)

# List all test results
@router.get("/", response_model=List[TestResultRead])
async def get_all_test_results(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a list of all test results."""
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized access")

    return test_logic.get_all_test_results(db)


# Get Results for a sample by Batch Number
@router.get("/sample/{sample_batch_number}", response_model=List[TestResultRead])
async def get_test_results_by_sample_batch_number(
    sample_batch_number: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    ):
    """
    Get test results for a sample by its batch number.

    Parameters:
        sample_batch_number (str): The batch number of the sample.
        user: The current authenticated user.
        db: The SQLAlchemy database session.

    Returns:
        List[TestResultRead]: The test results for the sample.

    Responses:
        200: Test results retrieved successfully.
        401: Unauthorized access.
        403: Not authorized to access test results for this sample.
        404: Sample not found.
    """

    sample = sample_logic.get_sample_by_batch_number(db, sample_batch_number)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized access")

    if not sample_logic.user_can_access_sample(user, sample):
        raise HTTPException(status_code=403, detail="Not authorized to access sample")
    
    test_results = test_logic.get_test_results_by_sample_batch_number(db, sample_batch_number)

    if not test_results:
        raise HTTPException(status_code=404, detail="Test results not found for this sample")
    
    return test_results

# Get all test results for the current user
@router.get("/{test_id}", response_model=TestResultRead)
async def get_test_result(
    test_id: UUID, 
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    ):
    """
    Retrieve a test result by its ID.

    Parameters:
        test_id (UUID): The ID of the test result to retrieve.
        user: The current authenticated user.
        db: The SQLAlchemy database session.    

    Returns:
        TestResultRead: The requested test result.

    Responses:
        200: Test result retrieved successfully.
        401: Unauthorized access.
        403: Not authorized to access this test result.
        404: Test result not found.
    """
    test = test_logic.get_test_result_by_id(db, test_id)

    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized access")
    
    if not test_logic.user_can_access_test_result(user, test):
        raise HTTPException(status_code=403, detail="Not authorized to access this test result")
    
    if test is None:
        raise HTTPException(status_code=404, detail="Test result not found")

    return test

# Get all test results for a specific sample
@router.get("/sample/{sample_id}", response_model=List[TestResultRead])
async def get_tests_for_sample(
    sample_id: UUID,
    sample_batch_number: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    ):
    """
    Retrieve all test results for a specific sample.

    Parameters:
        sample_id (UUID): The ID of the sample to retrieve test results for. Must be a positive integer.
        user: The current authenticated user.
        db: The SQLAlchemy database session.

    Returns:
        List[TestResultRead]: A list of test results for the specified sample.

    Responses:
        200: Test results retrieved successfully.
        401: Unauthorized access.
        403: Not authorized to access test results for this sample.
        404: Sample not found.
    """

    sample = sample_logic.get_sample_by_batch_number(db, sample_batch_number)
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized access")
    
   
    if not sample_logic.user_can_access_sample(user, sample):
        raise HTTPException(status_code=403, detail="Not authorized to access sample")

    if sample is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    return test_logic.get_test_results_by_sample_batch_number(db, sample_id)

# Update an existing test result
@router.put("/{test_id}", response_model=TestResultRead)
async def update_test_result(
    test_id: UUID, 
    test_in: TestResultCreate, 
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    ):
    """
    Update an existing test result.

    Parameters:
        test_id (UUID): The ID of the test result to update. Must be a positive integer.
        test_in (TestResultCreate): The updated test result data.
        user: The current authenticated user.
        db: The SQLAlchemy database session.

    Returns:
        TestResultRead: The updated test result.

    Responses:
        200: Test result updated successfully.
        401: Unauthorized access.
        403: Not authorized to update this test result.
        404: Test result not found.
        409: Test result already exists.
    """
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized access")

    if not test_logic.user_can_access_test_result(user, test_id):
        raise HTTPException(status_code=403, detail="Not authorized to update this test result")

    updated_test = test_logic.update_test_result(test_id, test_in, user.employee_id)
    if updated_test is None:
        raise HTTPException(status_code=404, detail="Test result not found or not authorized to update")

    if updated_test is False:
        raise HTTPException(status_code=409, detail="Test result already exists")

    return updated_test

# Delete a test result
@router.delete("/{test_id}", status_code=204)
async def delete_test_result(
    test_id: UUID, 
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a test result.

    Parameters:
        test_id (UUID):  The ID of the test result to delete.
        user: The current authenticated user.
        db: The SQLAlchemy database session.

    Returns:
        dict: A success message.

    Responses:
        204: Test result deleted successfully.
        401: Unauthorized access.
        403: Not authorized to delete this test result.
        404: Test result not found.
    """
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized access")

    test = test_logic.get_test_result_by_id(db, test_id)
    if test is None:
        raise HTTPException(status_code=404, detail="Test result not found")

    if not test_logic.user_can_access_test_result(user, test):
        raise HTTPException(status_code=403, detail="Not authorized to delete this test result")

    test_logic.delete_test_result(db, test)

    return {"message": "Test result deleted successfully"}
