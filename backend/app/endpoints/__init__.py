from fastapi import APIRouter
from app.endpoints import users, samples, tests, attachments, dashboard, qc_manager, admin, requests

api_router = APIRouter()

# Include API routers for modularity and organization
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(samples.router, prefix="/samples", tags=["Samples"])
api_router.include_router(tests.router, prefix="/tests", tags=["Tests"])
api_router.include_router(attachments.router, prefix="/attachments", tags=["Attachments"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(qc_manager.router, prefix="/manager", tags=["Manager"])
api_router.include_router(requests.router, prefix="/requests", tags=["Requests"])

# Placeholder for admin router, if needed in the future
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])