"""
VisionAI SQLAlchemy ORM Models
"""
import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from database import Base


class Report(Base):
    """Compliance analysis report saved after each image scan."""
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    standard = Column(String(100), nullable=False)
    score = Column(Float, nullable=False)
    summary = Column(Text, nullable=False)
    issues = Column(Text, nullable=False)          # JSON string
    recommendations = Column(Text, nullable=False) # JSON string
    image_filename = Column(String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat() if self.date else None,
            "standard": self.standard,
            "score": self.score,
            "summary": self.summary,
            "issues": json.loads(self.issues) if self.issues else [],
            "recommendations": json.loads(self.recommendations) if self.recommendations else [],
            "image_filename": self.image_filename,
        }


class InterviewResult(Base):
    """Voice interview session result stored after completing 5 questions."""
    __tablename__ = "interview_results"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    standard = Column(String(100), nullable=False)
    overall_score = Column(Float, nullable=False)
    strengths = Column(Text, nullable=True)        # JSON string (list)
    weaknesses = Column(Text, nullable=True)       # JSON string (list)
    suggestions = Column(Text, nullable=True)      # JSON string (list)
    answers = Column(Text, nullable=True)          # JSON string (list of Q&A)

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat() if self.date else None,
            "standard": self.standard,
            "overall_score": self.overall_score,
            "strengths": json.loads(self.strengths) if self.strengths else [],
            "weaknesses": json.loads(self.weaknesses) if self.weaknesses else [],
            "suggestions": json.loads(self.suggestions) if self.suggestions else [],
            "answers": json.loads(self.answers) if self.answers else [],
        }
