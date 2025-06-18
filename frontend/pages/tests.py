from nicegui import ui

from utils.session import token
from components.sidebar import render_sidebar
from services.test_service import fetch_tests

@ui.page("/tests")
async def test_page():
    if not token:
        ui.navigate.to("/")
        return

    render_sidebar()

    with ui.column().classes("pl-64"):
        ui.label("Test Results").classes("text-2xl font-bold mt-4")

        table = ui.table(
            columns=[
                {"name": "sample_id", "label": "Sample ID", "field": "sample_id"},
                {"name": "parameter", "label": "Parameter", "field": "parameter"},
                {"name": "value", "label": "Value", "field": "value"},
                {"name": "status", "label": "Status", "field": "status"},
                {"name": "tested_at", "label": "Tested At", "field": "tested_at"},
            ],
            rows=[],
            row_key="id"
        ).classes("w-full mt-4")

        # Load test results
        tests = await fetch_tests()
        for t in tests:
            t["tested_at"] = t["tested_at"].split("T")[0] if t.get("tested_at") else "—"
            t["status"] = t["status"].replace("_", " ").title()
        table.rows = tests
