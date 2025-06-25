from nicegui import ui

from utils import session

# Topbar with page name and user info

def render_topbar(title: str):
    with ui.row().classes("items-center justify-between px-6 py-2 bg-gray-100 shadow w-full fixed top-0 z-50"):
        # Page Title
        ui.label(title).classes("text-lg font-bold")

        # Greeting + User Info and Profile
        with ui.row().classes("items-center gap-6 ml-auto"):
            # Greeting - show employee_id, full_name, role
            formatted_role = session.user_info.get('role', '').replace('_', ' ').title()
            employee_id = session.user_info.get('employee_id', '')
            full_name = session.user_info.get('full_name', '')
            ui.label(f"Welcome, {employee_id} — {full_name} — {formatted_role}") \
                .classes("text-md font-semibold")

            # User Menu
            with ui.menu():
                ui.menu_item("Profile", on_click=lambda: ui.open("/profile"))
                ui.menu_item("Logout", on_click=lambda: ui.open("/logout"))

# User info in the right of the topbar
def user_info():
    return ui.label(session.user_info.get("username")).classes("font-bold")

# Page name in the left of the topbar
def page_name():
    return ui.label(ui.run_javascript("document.title")).classes("font-bold")

# Profile dropdown in the far right of the topbar
def profile_dropdown():
    return ui.dropdown().classes("ml-auto").on("click", lambda: ui.open("/profile"))