from nicegui import ui

from services.dashboard_service import fetch_count, show_latest_samples
from utils import session
from components.sidebar import render_sidebar
from components.topbar import render_topbar
from components.cards import card

# --- Dashboard Page ---

# Define the dashboard page
@ui.page("/dashboard")
async def dashboard_page():
    if not session.token:
        ui.navigate.to("/")
        return

    # Sidebar and Topbar
    render_sidebar()
    render_topbar("Dashboard")

    # Fetch summary counts
    summary = await fetch_count(session.token)

    # KPI Cards Row
    with ui.row().classes("gap-4 mt-6"):
        card("Samples", summary.get("samples_count", 0))
        card("Tests", summary.get("tests_count", 0))

    # Latest Samples
    ui.label("Latest Samples").classes("text-lg font-bold mt-8 mb-2")
    await show_latest_samples(session.token)
