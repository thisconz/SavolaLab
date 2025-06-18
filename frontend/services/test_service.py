import httpx, os
from dotenv import load_dotenv

from utils.session import token

load_dotenv()
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

async def fetch_tests():
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{BACKEND_URL}/tests", headers=headers)
        if res.status_code == 200:
            return res.json()
        return []
