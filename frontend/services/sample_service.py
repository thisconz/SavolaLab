import httpx, os
from dotenv import load_dotenv

from utils.session import token

load_dotenv()
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

async def fetch_samples():
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{BACKEND_URL}/samples/", headers=headers)
        if res.status_code == 200:
            return res.json()
        return []

async def create_sample(sample_type, batch_number, collected_at, location, notes):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "sample_type": sample_type,
        "batch_number": batch_number,
        "collected_at": collected_at,
        "location": location,
        "notes_text": notes,
        # omit "assigned_to"
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{BACKEND_URL}/samples/", headers=headers, json=payload)
        return res.status_code == 201
