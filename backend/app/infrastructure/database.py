from sqlalchemy import text
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

# Import settings
from .config import settings

# Import Base
from app.domain.base import Base

# Engine
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Get the database URL from the settings
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

# Initialize the database tables
def init_db():
    with engine.begin() as conn:
        Base.metadata.create_all(bind=conn)

# Drop all database tables
def drop_tables():
    with engine.begin() as conn:
        Base.metadata.drop_all(bind=conn)
