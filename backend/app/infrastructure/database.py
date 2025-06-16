from sqlalchemy import text
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

from .config import settings
from app.domain.base import Base


engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# This module provides functions to manage the database connection and operations.
# This module provides a function to get a database session.
def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        print(f"Database error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

# This module provides functions to manage the database connection and operations.
# This module provides a function to initialize the database tables and run raw SQL if exists.
def init_db():
    with engine.begin() as conn:
        Base.metadata.create_all(bind=conn)
        try:
            with open("docker/postgres/init.sql", "r") as f:
                init_sql = f.read()
            sql_commands = init_sql.split(';')
            for cmd in sql_commands:
                cmd = cmd.strip()
                if cmd:
                    conn.execute(text(cmd))
        except FileNotFoundError:
            print("No init.sql file found; skipping raw SQL initialization.")
        print("All database tables initialize successfully.")

# This module provides functions to manage the database connection and operations.
# This module provides functions to reset the database tables.
def reset_tables():
    """
    Reset all database tables.
    This function is used for testing purposes.
    """
    with engine.begin() as conn:
        # Drop all tables and recreate them
        Base.metadata.drop_all(bind=conn)
        Base.metadata.create_all(bind=conn)

        # Optional: run raw SQL from init file if exists
        try:
            with open("docker/postgres/ini.sql", "r") as f:
                init_sql = f.read()
            conn.execute(text(init_sql))
        except FileNotFoundError:
            print("No ini.sql file found; skipping raw SQL initialization.")
        print("All database tables reset successfully.")

# This module provides functions to manage the database connection and operations.
# This module provides functions to drop all database tables.
def drop_tables():
    """
    Drop all database tables.
    This function is used for testing purposes.
    """
    with engine.begin() as conn:
        # Drop all tables
        Base.metadata.drop_all(bind=conn)

        # Optional: run raw SQL from init file if exists
        try:
            with open("docker/postgres/ini.sql", "r") as f:
                init_sql = f.read()
            conn.execute(text(init_sql))
        except FileNotFoundError:
            print("No ini.sql file found; skipping raw SQL initialization.")
        print("All database tables dropped successfully.")

