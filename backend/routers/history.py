"""
History Routers:
  GET /api/history        → Paginated list of all compliance reports
  GET /api/history/{id}   → Full detail of a single report
"""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db
from models import Report
from schemas import HistoryResponse, ReportSummary, ReportDetail

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/history", response_model=HistoryResponse)
async def get_history(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=10, ge=1, le=50, description="Items per page"),
    standard: Optional[str] = Query(default=None, description="Filter by standard"),
    db: Session = Depends(get_db),
):
    """
    Retrieve paginated compliance report history.

    Sorted by most recent first.
    Optionally filter by compliance standard.
    """
    query = db.query(Report)

    # Optional filter by standard
    if standard:
        query = query.filter(Report.standard == standard)

    total = query.count()

    reports = (
        query.order_by(desc(Report.date))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return HistoryResponse(
        reports=[
            ReportSummary(
                id=r.id,
                date=r.date.isoformat(),
                standard=r.standard,
                score=r.score,
            )
            for r in reports
        ],
        total=total,
    )


@router.get("/history/{report_id}", response_model=ReportDetail)
async def get_report_detail(
    report_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieve full detail of a single compliance report by ID.
    """
    report = db.query(Report).filter(Report.id == report_id).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail=f"Report with ID {report_id} not found.",
        )

    report_dict = report.to_dict()

    return ReportDetail(
        id=report_dict["id"],
        date=report_dict["date"],
        standard=report_dict["standard"],
        score=report_dict["score"],
        summary=report_dict["summary"],
        issues=report_dict["issues"],
        recommendations=report_dict["recommendations"],
    )
