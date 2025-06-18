from nicegui import ui

from utils.session import token, user_info
from components.sidebar import render_sidebar
from components.sample_form import render_create_sample_form
from services.sample_service import fetch_samples

@ui.page("/samples")
async def sample_page():
    if not token:
        ui.navigate.to("/")
        return

    render_sidebar()

    with ui.column().classes("pl-64"):
        ui.label("Samples").classes("text-2xl font-bold mt-4")

        if user_info["role"] in ["chemist", "shift_chemist"]:
            with ui.expansion("Create New Sample").classes("w-full"):
                await render_create_sample_form()

        ui.label("Recent Samples").classes("text-lg font-bold mt-6")

        table = ui.table(
            columns=[
                {"name": "sample_type", "label": "Sample Type", "field": "sample_type"},
                {"name": "batch_number", "label": "Batch #", "field": "batch_number"},
                {"name": "collected_at", "label": "Collected At", "field": "collected_at"},
                {"name": "location", "label": "Location", "field": "location"},
            ],
            rows=[],
            row_key="id"
        ).classes("w-full mt-4")

        # Load samples
        samples = await fetch_samples()
        for s in samples:
            s["sample_type"] = s["sample_type"].replace("_", " ").title()
            s["collected_at"] = s["collected_at"].split("T")[0]
        table.rows = samples
