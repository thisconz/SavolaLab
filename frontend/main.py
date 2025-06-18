from nicegui import ui

# Register all routes from pages/
import pages.login
import pages.dashboard
import pages.samples
import pages.tests
import pages.users

# Start app
ui.run(title="SavolaLab Frontend", reload=True)
