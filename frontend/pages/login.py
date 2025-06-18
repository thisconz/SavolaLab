from nicegui import ui

from services.auth_service import login

@ui.page("/")
def login_page():
    ui.label("SavolaLab Login").classes("text-3xl font-bold text-center mt-10")
    with ui.card().classes("w-full max-w-sm mx-auto mt-8"):
        employee_id = ui.input("Employee ID").classes("w-full")
        password = ui.input("Password", password=True).classes("w-full")

        async def handle_login():
            success = await login(employee_id.value, password.value)
            if success:
                ui.navigate.to("/dashboard")
            else:
                ui.notify("Login failed", color="negative")

        ui.button("Login", on_click=handle_login).classes("mt-4 w-full")

        ui.label("Forgot password?").classes("text-sm mt-4 text-center")
