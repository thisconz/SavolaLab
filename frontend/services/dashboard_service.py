import httpx, os
from nicegui import ui
from dotenv import load_dotenv

from utils.session import token

load_dotenv()
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

async def fetch_count():
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BACKEND_URL}/dashboard/summary", headers=headers)
        if response.status_code == 200:
            return response.json()
        return {"samples_count": 0, "tests_count": 0}

async def show_latest_samples():
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BACKEND_URL}/samples/latest", headers=headers)
        if response.status_code == 200:
            s = response.json()
            sample_type_display = s['sample_type'].replace('_', ' ').title()
            ui.label(f"Sample {s['batch_number']} — {sample_type_display}")
        else:
            ui.label("No Samples").classes('text-red-500')