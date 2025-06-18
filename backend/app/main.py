import uvicorn
import asyncio
import logging
import os
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI

from app.infrastructure.config import settings
from app.infrastructure.database import drop_tables, init_db, reset_tables
from app.endpoints import attachments, dashboard, samples, tests, users, qc_manager, admin, requests

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
    allow_origins=["http://localhost:8080"],
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
app.include_router(requests.router, prefix="/requests", tags=["Requests"])

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    loop = asyncio.get_running_loop()

    def db_startup_logic():
        if os.environ.get("DROP_DB", "false").lower() == "true":
            drop_tables()
            logging.info("Database tables dropped successfully.")
        elif os.environ.get("RESET_DB", "false").lower() == "true":
            reset_tables()
            logging.info("Database tables reset successfully.")
        else:
            init_db()
            logging.info("Database initialized successfully.")

    try:
        with ThreadPoolExecutor() as pool:
            await loop.run_in_executor(pool, db_startup_logic)
    except Exception as e:
        logging.exception("Database startup logic failed")

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
