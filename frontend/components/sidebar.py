from nicegui import ui

from services.auth_service import logout
from utils import session

def render_sidebar():
    with ui.left_drawer().classes("bg-gray-100 w-64 shadow-md"):
        ui.label("SavolaLab").classes("text-xl font-bold mt-4 ml-4 text-green-800")
        ui.link("Dashboard", "/dashboard").classes("ml-4 mt-2 text-sm text-black")

        role = session.user_info.get("role")

        if role in ["chemist", "shift_chemist", "qc_manager", "admin"]:
            ui.label("QC").classes("ml-4 mt-2 text-sm text-black")
            ui.link("Samples", "/samples").classes("ml-4 mt-2 text-sm text-black")
            ui.link("Tests", "/tests").classes("ml-4 mt-2 text-sm text-black")
            ui.link("Requests Sample", "/requests").classes("ml-4 mt-2 text-sm text-black")

        if role in ["qc_manager", "admin", "other"]:
            ui.label("Other").classes("ml-4 mt-2 text-sm text-black")
            ui.link("Requests Test", "/requests").classes("ml-4 mt-2 text-sm text-black")
            ui.link("Results", "/results").classes("ml-4 mt-2 text-sm text-black")

        if role in ["qc_manager", "admin"]:
            ui.label("Administration").classes("ml-4 mt-2 text-sm text-black")
            ui.link("User Management", "/users").classes("ml-4 mt-2 text-sm text-black")

        ui.button("Logout", on_click=logout).props("flat").classes("ml-4 mt-4 text-red-600")
