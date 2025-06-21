from nicegui import ui
from utils.session import token, user_info
from services.test_service import create_test, fetch_sample_ids

@ui.page("/tests")
async def test_entry_page():
    if not token or user_info.get("role") not in ["chemist", "shift_chemist", "qc_manager" "admin"]:
        ui.navigate.to("/dashboard")
        return

    ui.label("Enter New Test Result").classes("text-2xl font-bold mt-4 pl-64")

    with ui.card().classes("w-full max-w-3xl mt-6 mx-auto shadow-xl"):
        samples = await fetch_sample_ids()
        sample_select = ui.select(samples, label="Select Sample ID").classes("w-full")
        parameter = ui.input("Test Parameter (e.g., pH)").classes("w-full")
        value = ui.input("Measured Value").classes("w-full")
        unit = ui.input("Unit (optional)").classes("w-full")
        status = ui.select(["pending", "completed"], label="Status").classes("w-full")

        async def submit():
            if not all([sample_select.value, parameter.value, value.value, status.value]):
                ui.notify("Fill all required fields", color="warning")
                return

            result = await create_test(
                sample_id=sample_select.value,
                parameter=parameter.value,
                value=value.value,
                unit=unit.value,
                status=status.value
            )
            if result:
                ui.notify("Test created successfully", color="positive")
            else:
                ui.notify("Failed to create test", color="negative")

        ui.button("Submit", on_click=submit).classes("mt-4")
