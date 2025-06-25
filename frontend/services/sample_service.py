import httpx
import os
from dotenv import load_dotenv
from typing import List, Dict, Optional
from datetime import datetime

load_dotenv()
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


def validate_iso_datetime(dt_str: str) -> bool:
    """Validate if a string is ISO 8601 datetime format."""
    try:
        datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        return True
    except ValueError:
        return False


async def fetch_samples(token: str) -> List[Dict]:
    """
    Fetch all samples from backend.

    Args:
        token: Bearer token string for authorization.

    Returns:
        List of sample dictionaries.

    Raises:
        httpx.HTTPStatusError: if response status is not 200.
        httpx.RequestError: on request failure.
    """
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(f"{BACKEND_URL}/samples/", headers=headers)
        response.raise_for_status()
        return response.json()


async def create_sample(
    token: str,
    sample_type: str,
    batch_number: str,
    collected_at: str,
    location: str,
    notes: Optional[str] = None,
) -> bool:
    """
    Create a new sample in the backend.

    Args:
        token: Bearer token string for authorization.
        sample_type: Type of sample (e.g., 'white_sugar').
        batch_number: Unique batch number string.
        collected_at: ISO 8601 datetime string.
        location: Sample collection location string.
        notes: Optional notes about the sample.

    Returns:
        True if sample creation succeeded, else False.

    Raises:
        ValueError: If collected_at is not a valid ISO 8601 datetime.
        httpx.HTTPStatusError: if response status is not 201.
        httpx.RequestError: on request failure.
    """
    if not validate_iso_datetime(collected_at):
        raise ValueError(f"Invalid ISO 8601 datetime: {collected_at}")

    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "sample_type": sample_type,
        "batch_number": batch_number,
        "collected_at": collected_at,
        "location": location,
        "notes_text": notes or "",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(f"{BACKEND_URL}/samples/", headers=headers, json=payload)
        response.raise_for_status()
        return response.status_code == 201
