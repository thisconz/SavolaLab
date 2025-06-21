import httpx, os
from dotenv import load_dotenv

from utils.session import token

load_dotenv()
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

async def fetch_sample_ids():
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{BACKEND_URL}/samples", headers=headers)
        if res.status_code == 200:
            samples = res.json()
            return [s["id"] for s in samples]
        return []

async def create_test(sample_id, parameter, value, unit, status):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "sample_id": sample_id,
        "parameter": parameter,
        "value": value,
        "unit": unit,
        "status": status,
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{BACKEND_URL}/tests/", headers=headers, json=payload)
        return res.status_code == 201
