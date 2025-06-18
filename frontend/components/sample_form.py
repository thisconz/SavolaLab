from nicegui import ui
from datetime import datetime

from services.sample_service import create_sample

async def render_create_sample_form():
    sample_type = ui.select(
        ["white_sugar", "brown_sugar", "raw_sugar",
         "fine_liquor", "polish_liquor", "evaporator_liquor", "sat_out"],
        label="Sample Type"
    )
    batch_number = ui.input("Batch Number")
    location = ui.input("Location")
    notes_text = ui.textarea("Notes (optional)")
    collected_at = ui.input("Collection Date", value=datetime.now().strftime("%Y-%m-%d"), type="date")

    async def submit_sample():
        if not sample_type.value or not batch_number.value or not location.value or not collected_at.value:
            ui.notify("Please fill all required fields", color="warning")
            return
        ui.notify("Submitting...", color="primary")

        result = await create_sample(
            sample_type.value,
            batch_number.value,
            collected_at.value + "T00:00:00",
            location.value,
            notes_text.value or ""
        )

        if result:
            ui.notify("Sample created successfully", color="positive")
        else:
            ui.notify("Failed to create sample", color="negative")

    ui.button("Submit", on_click=submit_sample).classes("mt-2")
