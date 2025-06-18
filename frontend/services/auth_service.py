from nicegui import ui
import httpx, os
from dotenv import load_dotenv

from utils import session

load_dotenv()
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

async def login(employee_id: str, password: str) -> bool:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BACKEND_URL}/users/login",
            data={"username": employee_id, "password": password}
        )
        if response.status_code == 200:
            session.token = response.json()["access_token"]
            headers = {"Authorization": f"Bearer {session.token}"}
            session.user_info = (await client.get(f"{BACKEND_URL}/users/me", headers=headers)).json()
            return True
        else:
            return False

def logout():
    session.token = None
    session.user_info.clear()
    ui.navigate.to("/")
    ui.notify("Logout successful", color="positive")