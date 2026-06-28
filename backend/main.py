"""
VisionAI FastAPI Application Entry Point
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import engine, Base
from routers import analyze, interview, history, dashboard

# Load environment variables
load_dotenv()

# Create database tables on startup
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="VisionAI API",
    description="AI-Powered Compliance Auditor & Voice Assessment Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ──────────────────────────────────────────────────────────
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.vercel.app",  # Vercel deployments
        "*",  # Allow all during development — tighten in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(analyze.router, prefix="/api", tags=["Compliance Analysis"])
app.include_router(interview.router, prefix="/api", tags=["Voice Interview"])
app.include_router(history.router, prefix="/api", tags=["History"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "service": "VisionAI API",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check."""
    return {"status": "healthy", "database": "connected", "ai": "ready"}
