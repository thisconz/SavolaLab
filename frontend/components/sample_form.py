from nicegui import ui
from datetime import datetime
from datetime import date

from services.sample_service import create_sample
from utils import session  # assuming session.token is accessible

async def render_create_sample_form():
    sample_type = ui.select(
        ["white_sugar", "brown_sugar", "raw_sugar",
         "fine_liquor", "polish_liquor", "evaporator_liquor", "sat_out"],
        label="Sample Type",
    )
    batch_number = ui.input(label="Batch Number")
    location = ui.input(label="Location")
    notes_text = ui.textarea(label="Notes (optional)")
    ui.label("Collection Date")
    collected_at = ui.date(value=date.today())

    submit_button = ui.button("Submit").classes("mt-2")

    async def submit_sample():
        if not sample_type.value or not batch_number.value or not location.value or not collected_at.value:
            ui.notify("Please fill all required fields", color="warning")
            return

        submit_button.disabled = True
        ui.notify("Submitting...", color="primary")

        collected_at_str = collected_at.value.isoformat() + "T00:00:00"

        result = await create_sample(
            token=session.token,
            sample_type=sample_type.value,
            batch_number=batch_number.value,
            collected_at=collected_at_str,
            location=location.value,
            notes=notes_text.value or ""
        )

        if result:
            ui.notify("Sample created successfully", color="positive")
            # Optional: clear inputs
            sample_type.value = None
            batch_number.value = ""
            location.value = ""
            notes_text.value = ""
            collected_at.value = datetime.now().strftime("%Y-%m-%d")
        else:
            ui.notify("Failed to create sample", color="negative")

        submit_button.disabled = False

    submit_button.on("click", submit_sample)
