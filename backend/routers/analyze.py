"""
POST /api/analyze
Receives an image + compliance standard, runs Gemini Vision analysis,
saves report to SQLite, and returns full compliance results.
"""
import json
import logging
from datetime import datetime

from fastapi import APIRouter, File, Form, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Report
from schemas import AnalyzeResponse
from services.gemini_service import analyze_image

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png"}
MAX_FILE_SIZE_MB = 10


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_compliance(
    image: UploadFile = File(..., description="Room image (JPG/PNG)"),
    standard: str = Form(..., description="Compliance standard to evaluate against"),
    db: Session = Depends(get_db),
):
    """
    Analyze a room image for compliance.

    - Validates image type and size
    - Sends image to Gemini 2.5 Flash Vision
    - Saves result to SQLite database
    - Returns structured compliance report
    """
    # ── Validate file type ────────────────────────────────────────────────────
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{image.content_type}'. Only JPG and PNG are accepted.",
        )

    # ── Read and validate file size ───────────────────────────────────────────
    image_bytes = await image.read()
    file_size_mb = len(image_bytes) / (1024 * 1024)
    if file_size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({file_size_mb:.1f}MB). Maximum allowed is {MAX_FILE_SIZE_MB}MB.",
        )

    # ── Validate standard ─────────────────────────────────────────────────────
    valid_standards = [
        "General Safety",
        "Kitchen Hygiene",
        "Office Safety",
        "Hostel Safety",
        "Warehouse Safety",
        "Laboratory Safety",
    ]
    if standard not in valid_standards:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid standard '{standard}'. Choose from: {', '.join(valid_standards)}",
        )

    # ── Call Gemini Vision ────────────────────────────────────────────────────
    try:
        ai_result = await analyze_image(image_bytes, standard)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"AI parsing error: {str(e)}")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in analyze: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during analysis.")

    # ── Save to Database ──────────────────────────────────────────────────────
    try:
        report = Report(
            date=datetime.utcnow(),
            standard=standard,
            score=float(ai_result["score"]),
            summary=ai_result["summary"],
            issues=json.dumps(ai_result["issues"]),
            recommendations=json.dumps(ai_result["recommendations"]),
            image_filename=image.filename,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
    except Exception as e:
        logger.error(f"Database save error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save report to database.")

    # ── Return Response ───────────────────────────────────────────────────────
    return AnalyzeResponse(
        id=report.id,
        score=report.score,
        summary=ai_result["summary"],
        issues=ai_result["issues"],
        recommendations=ai_result["recommendations"],
        standard=standard,
        date=report.date.isoformat(),
    )
