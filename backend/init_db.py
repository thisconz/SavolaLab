from app.infrastructure.database import init_db, reset_tables, drop_tables
import os

# This script initializes the database for the SavolaLab application.
if __name__ == "__main__":
    # Check for DROP first
    if os.environ.get("DROP_DB", "false").lower() == "true":
        drop_tables()
        print("Database tables dropped successfully.")
    
    # Then reset if needed
    elif os.environ.get("RESET_DB", "false").lower() == "true":
        reset_tables()
        print("Database tables reset successfully.")

    # Otherwise, just init
    else:
        init_db()
        print("Database initialized successfully.")