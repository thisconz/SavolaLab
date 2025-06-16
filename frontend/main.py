from nicegui import ui, app
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
token = None
user_info = {}

# -------------------- AUTH --------------------
async def login(employee_id: str, password: str):
    global token, user_info
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BACKEND_URL}/users/login",
            data={"username": employee_id, "password": password}
        )
        if response.status_code == 200:
            token = response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            user_info = (await client.get(f"{BACKEND_URL}/users/me", headers=headers)).json()
            ui.navigate.to("/dashboard")
        else:
            ui.notify("Login failed", color="negative")

# -------------------- PAGES --------------------
@ui.page("/")
def login_page():
    ui.label("SavolaLab Login").classes("text-3xl font-bold text-center mt-10")
    with ui.card().classes("w-full max-w-sm mx-auto mt-8"):
        employee_id = ui.input("Employee ID").classes("w-full")
        password = ui.input("Password", password=True).classes("w-full")
        ui.button("Login", on_click=lambda: login(employee_id.value, password.value)).classes("mt-4 w-full")

@ui.page("/dashboard")
async def dashboard_page():
    global token
    if not token:
        ui.navigate.to("/")
        return

    # Greeting
    ui.label(f"Welcome, {user_info['employee_id']} — {user_info['full_name']}") \
        .classes("text-2xl font-bold mt-4")

    # Fetch summary counts (samples, tests)
    summary = await fetch_count()

    # KPI Cards Row
    with ui.row().classes("gap-4 mt-6"):
        card("Samples", summary.get("samples_count", 0))
        card("Tests", summary.get("tests_count", 0))

    # Latest Samples Section Title
    ui.label("Latest Samples").classes("text-lg font-bold mt-8 mb-2")

    # Render Latest Samples
    await show_latest_samples()

# -------------------- HELPERS --------------------
def card(title, count):
    with ui.card().classes("w-64 bg-white shadow-xl rounded-xl"):
        ui.label(title).classes("text-md text-gray-500")
        ui.label(str(count)).classes("text-3xl font-bold text-green-700")

async def fetch_count():
    global token
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BACKEND_URL}/dashboard/summary", headers=headers)
        if response.status_code == 200:
            return response.json()
        return {"samples_count": 0, "tests_count": 0}

async def show_latest_samples():
    global token
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BACKEND_URL}/samples/latest", headers=headers)
        if response.status_code == 200:
            s = response.json()
            sample_type_display = s['sample_type'].replace('_', ' ').title()
            ui.label(f"Sample {s['batch_number']} — {sample_type_display}")
        else:
            ui.label("No Samples").classes('text-red-500')

# -------------------- RUN APP --------------------
ui.run(title="SavolaLab Frontend", reload=False)
