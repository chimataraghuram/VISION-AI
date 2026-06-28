"""
Interview Routers:
  POST /api/questions  → Generate 5 interview questions for a standard
  POST /api/evaluate   → Evaluate a single spoken answer
  POST /api/interview/save → Save completed interview session
"""
import json
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import InterviewResult
from schemas import (
    QuestionsRequest,
    QuestionsResponse,
    EvaluateRequest,
    EvaluateResponse,
    SaveInterviewRequest,
    InterviewResultResponse,
)
from services.gemini_service import (
    generate_questions,
    evaluate_answer,
    generate_final_summary,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/questions", response_model=QuestionsResponse)
async def get_interview_questions(request: QuestionsRequest):
    """
    Generate 5 compliance interview questions using Gemini.

    Returns a structured list of questions tailored to the selected standard.
    """
    if not request.standard.strip():
        raise HTTPException(status_code=400, detail="Standard cannot be empty.")

    try:
        questions = await generate_questions(request.standard)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error generating questions: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate questions.")

    return QuestionsResponse(questions=questions, standard=request.standard)


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_interview_answer(request: EvaluateRequest):
    """
    Evaluate a single interview answer using Gemini.

    Scores the answer 1-10 and provides constructive feedback.
    """
    if not request.answer.strip():
        raise HTTPException(
            status_code=400,
            detail="Answer transcript cannot be empty. Please speak your answer.",
        )

    if len(request.answer.strip()) < 5:
        raise HTTPException(
            status_code=400,
            detail="Answer too short. Please provide a more complete response.",
        )

    try:
        result = await evaluate_answer(
            question=request.question,
            answer=request.answer,
            standard=request.standard,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error evaluating answer: {e}")
        raise HTTPException(status_code=500, detail="Failed to evaluate answer.")

    return EvaluateResponse(score=result["score"], feedback=result["feedback"])


@router.post("/interview/save", response_model=InterviewResultResponse)
async def save_interview_result(
    request: SaveInterviewRequest,
    db: Session = Depends(get_db),
):
    """
    Save a completed interview session to the database.
    Called after all 5 questions are answered.
    """
    # Generate final summary using Gemini
    try:
        answers_dicts = [a.dict() for a in request.answers]
        summary = await generate_final_summary(
            standard=request.standard,
            answers=answers_dicts,
            overall_score=request.overall_score,
        )
    except Exception as e:
        logger.warning(f"Final summary generation failed (non-critical): {e}")
        summary = {
            "strengths": request.strengths or [],
            "weaknesses": request.weaknesses or [],
            "suggestions": request.suggestions or [],
        }

    # Save to database
    try:
        interview = InterviewResult(
            date=datetime.utcnow(),
            standard=request.standard,
            overall_score=request.overall_score,
            strengths=json.dumps(summary["strengths"]),
            weaknesses=json.dumps(summary["weaknesses"]),
            suggestions=json.dumps(summary["suggestions"]),
            answers=json.dumps(answers_dicts),
        )
        db.add(interview)
        db.commit()
        db.refresh(interview)
    except Exception as e:
        logger.error(f"DB save error for interview: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save interview result.")

    return InterviewResultResponse(
        id=interview.id,
        date=interview.date.isoformat(),
        standard=interview.standard,
        overall_score=interview.overall_score,
        strengths=summary["strengths"],
        weaknesses=summary["weaknesses"],
        suggestions=summary["suggestions"],
        answers=request.answers,
    )
