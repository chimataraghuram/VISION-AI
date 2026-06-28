"""
Dashboard Router:
  GET /api/dashboard → Aggregate stats + recent reports + trend data
"""
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from database import get_db
from models import Report
from schemas import DashboardResponse, ReportSummary, TrendPoint

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(db: Session = Depends(get_db)):
    """
    Retrieve dashboard statistics:
    - Average, highest, and lowest compliance scores
    - Total number of reports
    - 5 most recent reports
    - Score trend data (last 20 reports, chronological)
    """
    total_reports = db.query(Report).count()

    if total_reports == 0:
        # Return empty dashboard when no data exists yet
        return DashboardResponse(
            average_score=0.0,
            highest_score=0.0,
            lowest_score=0.0,
            total_reports=0,
            recent_reports=[],
            trend=[],
        )

    # ── Aggregate scores ──────────────────────────────────────────────────────
    stats = db.query(
        func.avg(Report.score).label("avg_score"),
        func.max(Report.score).label("max_score"),
        func.min(Report.score).label("min_score"),
    ).first()

    avg_score = round(float(stats.avg_score or 0), 1)
    max_score = round(float(stats.max_score or 0), 1)
    min_score = round(float(stats.min_score or 0), 1)

    # ── Recent 5 reports ──────────────────────────────────────────────────────
    recent = (
        db.query(Report)
        .order_by(desc(Report.date))
        .limit(5)
        .all()
    )

    recent_reports = [
        ReportSummary(
            id=r.id,
            date=r.date.isoformat(),
            standard=r.standard,
            score=r.score,
        )
        for r in recent
    ]

    # ── Trend data: last 20 reports, chronological ────────────────────────────
    trend_reports = (
        db.query(Report)
        .order_by(desc(Report.date))
        .limit(20)
        .all()
    )
    trend_reports.reverse()  # Oldest first for chart display

    trend = [
        TrendPoint(
            date=r.date.strftime("%b %d"),
            score=r.score,
            standard=r.standard,
        )
        for r in trend_reports
    ]

    return DashboardResponse(
        average_score=avg_score,
        highest_score=max_score,
        lowest_score=min_score,
        total_reports=total_reports,
        recent_reports=recent_reports,
        trend=trend,
    )
