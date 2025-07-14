import uvicorn
import logging
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from app.infrastructure.config import settings
from app.infrastructure.database import drop_tables, init_db
from app.endpoints import attachments, dashboard, samples, tests, users, qc_manager, admin

# SavolaLab

# FastAPI application instance
app = FastAPI(
    title="SavolaLab",
    description="High-performance QC+QA backend for Savola sugar production",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(samples.router, prefix="/samples", tags=["Samples"])
app.include_router(tests.router, prefix="/tests", tags=["Tests"])
app.include_router(attachments.router, prefix="/attachments", tags=["Attachments"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(qc_manager.router, prefix="/manager", tags=["Manager"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])

# Initialize database
@app.post("/init", tags=["Database"])
async def init_database():
    """
    Initialize the database.
    """
    init_db()
    return {"message": "Database initialized successfully."}

# Drop database
@app.post("/drop", tags=["Database"])
async def drop_database():
    """Drop the database."""
    drop_tables()
    return {"message": "Database dropped successfully."}

# Health check endpoint
@app.get("/", tags=["Health Check"])
async def root():
    return {"message": "Welcome to SavolaLab QC+QA Backend"}


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log", mode='a', encoding='utf-8'),
        logging.NullHandler()
    ]
)

# Run the FastAPI application
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        factory=True,
        reload=True,
        log_level="info",
        workers=int(os.environ.get("APP_WORKERS", 1)),
        host=os.environ.get("APP_HOST", "127.0.0.1"),
        port=int(os.environ.get("APP_PORT", 8000)),
        allowed_hosts=["savolalab.com", "localhost", "127.0.0.1"]
    )
