from nicegui import ui

def card(title, count):
    with ui.card().classes("w-64 bg-white shadow-xl rounded-xl"):
        ui.label(title).classes("text-md text-gray-500")
        ui.label(str(count)).classes("text-3xl font-bold text-green-700")
