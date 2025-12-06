from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import validation, admin
import uvicorn

# Initialize FastAPI app
app = FastAPI(
    title="DigiTrust-AVP Address Validation Platform",
    description="Address Confidence Scoring with Multi-Layer Evidence Aggregation",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(validation.router)
app.include_router(admin.router)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()
    print("[OK] Database initialized")
    print("[OK] DigiTrust-AVP Backend is running")


@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "name": "DigiTrust-AVP Address Validation Platform",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "validation": "/api/validate",
            "result": "/api/result/{request_id}",
            "token": "/api/token/{request_id}",
            "history": "/api/history/{user_id}",
            "admin_dashboard": "/api/admin/dashboard",
            "admin_queue": "/api/admin/queue",
            "admin_confirm": "/api/admin/confirm",
            "admin_review": "/api/admin/review/{request_id}",
            "admin_revoke": "/api/admin/revoke/{token_id}"
        },
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "DigiTrust-AVP"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


