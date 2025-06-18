from nicegui import ui

from utils import session
from components.sidebar import render_sidebar
from services.user_service import fetch_users, create_user

@ui.page("/users")
def users_page():
    if not session.token:
        ui.run_javascript('window.location.href="/"')
        return

    allowed_roles = ["admin", "qc_manager"]
    role = session.user_info.get("role", "")
    if role not in allowed_roles:
        ui.notify("You do not have permission to access this page", color="negative")
        ui.run_javascript('window.location.href="/dashboard"')
        return

    render_sidebar()

    with ui.column().classes("pl-64"):
        ui.label("User Management").classes("text-2xl font-bold mt-4")

        user_table = ui.table(
            columns=[
                {"name": "employee_id", "label": "Employee ID", "field": "employee_id"},
                {"name": "full_name", "label": "Full Name", "field": "full_name"},
                {"name": "role", "label": "Role", "field": "role"},
            ],
            rows=[],
            row_key="id"
        ).classes("w-full mt-4")

        # Dialog
        dialog = ui.dialog()
        with dialog:
            with ui.card().classes("w-[400px]"):
                ui.label("Create New User").classes("text-xl font-bold mb-4")
                emp_id = ui.input("Employee ID").classes("w-full")
                full_name = ui.input("Full Name").classes("w-full")
                role_input = ui.select(["admin", "qc_manager", "shift_chemist", "chemist"], label="Role").classes("w-full")
                password = ui.input("Password", password=True).classes("w-full")

                async def submit():
                    result = await create_user(session.token, emp_id.value, full_name.value, role_input.value, password.value)
                    if "success" in result:
                        ui.notify("User created", color="positive")
                        dialog.close()
                        await fetch_users(session.token, user_table)
                    else:
                        ui.notify(result["error"], color="negative")

                with ui.row().classes("mt-4 justify-end"):
                    ui.button("Cancel", on_click=dialog.close)
                    ui.button("Create", on_click=submit, color="primary")

        if role in ["admin", "qc_manager"]:
            ui.button("Create New User", on_click=dialog.open).classes("mt-4")

        ui.label("Users").classes("text-lg font-bold mt-6")

        # Load users (inside UI context)
        async def load_users():
            result = await fetch_users(session.token, user_table)
            if "error" in result:
                ui.notify(result["error"], color="negative")

        ui.timer(0.1, load_users, once=True)  # Executes after initial render