"""
VisionAI Pydantic Schemas
Request/Response validation for all API endpoints
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ── Compliance Analysis Schemas ───────────────────────────────────────────────

class ComplianceIssue(BaseModel):
    title: str
    description: str


class AnalyzeResponse(BaseModel):
    id: int
    score: float = Field(ge=0, le=100, description="Compliance score 0–100")
    summary: str
    issues: List[ComplianceIssue]
    recommendations: List[str]
    standard: str
    date: str


# ── Interview Schemas ─────────────────────────────────────────────────────────

class QuestionsRequest(BaseModel):
    standard: str


class QuestionsResponse(BaseModel):
    questions: List[str]
    standard: str


class EvaluateRequest(BaseModel):
    question: str
    answer: str
    standard: str


class EvaluateResponse(BaseModel):
    score: int = Field(ge=1, le=10, description="Answer score 1–10")
    feedback: str
    performance_badge: str
    strengths: List[str]
    missing_points: List[str]
    suggested_answer: str
    difficulty: str
    estimated_accuracy: int


class AnswerRecord(BaseModel):
    question: str
    answer: str
    score: int
    feedback: str
    performance_badge: str
    strengths: List[str]
    missing_points: List[str]
    suggested_answer: str
    difficulty: str
    estimated_accuracy: int


class SaveInterviewRequest(BaseModel):
    standard: str
    overall_score: float
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]
    answers: List[AnswerRecord]


class InterviewResultResponse(BaseModel):
    id: int
    date: str
    standard: str
    overall_score: float
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]
    answers: List[AnswerRecord]


# ── History Schemas ───────────────────────────────────────────────────────────

class ReportSummary(BaseModel):
    id: int
    date: str
    standard: str
    score: float


class ReportDetail(BaseModel):
    id: int
    date: str
    standard: str
    score: float
    summary: str
    issues: List[ComplianceIssue]
    recommendations: List[str]


class HistoryResponse(BaseModel):
    reports: List[ReportSummary]
    total: int


# ── Dashboard Schemas ─────────────────────────────────────────────────────────

class TrendPoint(BaseModel):
    date: str
    score: float
    standard: str


class DashboardResponse(BaseModel):
    average_score: float
    highest_score: float
    lowest_score: float
    total_reports: int
    recent_reports: List[ReportSummary]
    trend: List[TrendPoint]
