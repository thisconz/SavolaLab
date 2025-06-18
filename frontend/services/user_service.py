
import httpx, os
from dotenv import load_dotenv
from nicegui import ui

from utils.session import token

load_dotenv()
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

async def fetch_users(token, table):
    if not token:
        return {"error": "Not authenticated"}

    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BACKEND_URL}/manager/users", headers=headers)
        except httpx.RequestError as e:
            return {"error": f"Network error: {e}"}

    if response.status_code == 200:
        try:
            users = response.json()
            for user in users:
                user["role"] = user["role"].replace("_", " ").title()
            table.update_rows(users)
            return {"success": True}
        except Exception as e:
            return {"error": f"Parse error: {e}"}
    else:
        return {"error": f"Error {response.status_code}"}

async def create_user(token, employee_id, full_name, role, password):
    if not token:
        return {"error": "Not authenticated"}

    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "employee_id": employee_id,
        "full_name": full_name,
        "role": role,
        "password": password
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{BACKEND_URL}/manager/create", headers=headers, json=payload)
        if response.status_code == 201:
            return {"success": True}
        else:
            return {"error": f"Failed to create user ({response.status_code})"}