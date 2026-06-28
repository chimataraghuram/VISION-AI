"""
VisionAI Gemini Service
Handles all interactions with Gemini 2.5 Flash AI model.

Functions:
  - analyze_image()     → compliance score, summary, issues, recommendations
  - generate_questions() → 5 interview questions for a standard
  - evaluate_answer()   → score + feedback for a spoken answer
  - generate_final_summary() → overall interview strengths/weaknesses
"""
import os
import json
import re
import io
import logging
from typing import Any, Dict, List

import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ── Gemini Client Configuration ───────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise EnvironmentError("GEMINI_API_KEY is not set in environment variables.")

genai.configure(api_key=GEMINI_API_KEY)

# Use gemini-2.5-flash for fast vision + text responses
MODEL_NAME = "gemini-2.5-flash"

# Generation config — low temperature for deterministic JSON output
generation_config = genai.GenerationConfig(
    temperature=0.2,
    top_p=0.95,
    max_output_tokens=4096,
)

model = genai.GenerativeModel(
    model_name=MODEL_NAME,
    generation_config=generation_config,
)


# ── Helper: Extract JSON from Gemini response ─────────────────────────────────
def _extract_json(text: str) -> Dict[str, Any]:
    """
    Parse JSON from Gemini response.
    Handles cases where Gemini wraps JSON in markdown code blocks.
    """
    # Strip markdown code block if present
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ``` wrappers
    json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if json_match:
        text = json_match.group(1).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}\nRaw text: {text[:500]}")
        raise ValueError(f"Gemini returned invalid JSON: {e}")


# ── 1. Compliance Image Analysis ──────────────────────────────────────────────
async def analyze_image(image_bytes: bytes, standard: str) -> Dict[str, Any]:
    """
    Send image to Gemini Vision for compliance analysis.

    Args:
        image_bytes: Raw image bytes (JPEG/PNG)
        standard: Selected compliance standard (e.g., "Kitchen Hygiene")

    Returns:
        Dict with keys: score, summary, issues, recommendations
    """
    # Convert bytes to PIL Image for Gemini
    pil_image = Image.open(io.BytesIO(image_bytes))

    prompt = f"""You are a certified compliance auditor with expertise in workplace and facility safety regulations.

Analyze the provided image according to the **{standard}** compliance standard.

Carefully examine:
- Physical environment and layout
- Equipment and furniture condition
- Safety signage and exits
- Cleanliness and hygiene
- Potential hazards or violations
- Storage and organization

Return ONLY valid JSON with no additional text or explanation.

JSON format:
{{
  "score": <integer 0-100, where 100 is fully compliant>,
  "summary": "<2-3 sentence executive summary of the compliance assessment>",
  "issues": [
    {{
      "title": "<short issue title>",
      "description": "<detailed explanation of the issue and why it violates {standard} standards>"
    }}
  ],
  "recommendations": [
    "<specific actionable recommendation 1>",
    "<specific actionable recommendation 2>",
    "<specific actionable recommendation 3>"
  ]
}}

If the image shows excellent compliance, issues array may be empty and score should be high.
Provide at least 3 recommendations regardless of score."""

    try:
        response = model.generate_content([prompt, pil_image])
        result = _extract_json(response.text)

        # Validate required fields
        required_fields = ["score", "summary", "issues", "recommendations"]
        for field in required_fields:
            if field not in result:
                raise ValueError(f"Missing required field '{field}' in Gemini response")

        # Ensure score is within bounds
        result["score"] = max(0, min(100, int(result["score"])))

        return result

    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Gemini analyze_image error: {e}")
        raise RuntimeError(f"Gemini Vision analysis failed: {str(e)}")


# ── 2. Generate Interview Questions ───────────────────────────────────────────
async def generate_questions(standard: str) -> List[str]:
    """
    Generate 5 interview questions for a compliance standard.

    Args:
        standard: Compliance standard name (e.g., "Office Safety")

    Returns:
        List of exactly 5 question strings
    """
    prompt = f"""You are a compliance training expert conducting a professional knowledge assessment.

Generate exactly 5 interview questions to evaluate a person's knowledge and understanding of **{standard}** compliance standards.

Questions should:
- Range from basic to advanced
- Cover regulations, procedures, best practices, and emergency protocols
- Be clear and specific to {standard}
- Be answerable verbally in 30-90 seconds

Return ONLY valid JSON with no additional text:
{{
  "questions": [
    "<question 1>",
    "<question 2>",
    "<question 3>",
    "<question 4>",
    "<question 5>"
  ]
}}"""

    try:
        response = model.generate_content(prompt)
        result = _extract_json(response.text)

        questions = result.get("questions", [])
        if len(questions) != 5:
            raise ValueError(f"Expected 5 questions, got {len(questions)}")

        return questions

    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Gemini generate_questions error: {e}")
        raise RuntimeError(f"Question generation failed: {str(e)}")


# ── 3. Evaluate Interview Answer ──────────────────────────────────────────────
async def evaluate_answer(question: str, answer: str, standard: str) -> Dict[str, Any]:
    """
    Evaluate a spoken interview answer using Gemini.

    Args:
        question: The interview question asked
        answer: Transcribed speech-to-text answer from candidate
        standard: The compliance standard being tested

    Returns:
        Dict with keys: score (1-10), feedback (string)
    """
    prompt = f"""You are a senior compliance examiner evaluating a candidate's verbal response.

Compliance Standard Being Tested: **{standard}**

Question Asked:
"{question}"

Candidate's Answer (speech-to-text transcript):
"{answer}"

Evaluate the answer based on:
- Accuracy of compliance knowledge
- Completeness of the response
- Practical applicability
- Understanding of regulations
- Clarity of explanation

Return ONLY valid JSON with no additional text:
{{
  "score": <integer 1-10, where 10 is a perfect expert-level answer>,
  "feedback": "<2-3 sentences of constructive feedback: what was good, what was missing, what they should know>"
}}"""

    try:
        response = model.generate_content(prompt)
        result = _extract_json(response.text)

        # Validate and clamp score
        score = int(result.get("score", 5))
        result["score"] = max(1, min(10, score))

        if "feedback" not in result:
            result["feedback"] = "No feedback available."

        return result

    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Gemini evaluate_answer error: {e}")
        raise RuntimeError(f"Answer evaluation failed: {str(e)}")


# ── 4. Generate Final Interview Summary ───────────────────────────────────────
async def generate_final_summary(
    standard: str,
    answers: List[Dict[str, Any]],
    overall_score: float
) -> Dict[str, Any]:
    """
    Generate a comprehensive final summary for the completed interview.

    Args:
        standard: Compliance standard tested
        answers: List of {question, answer, score, feedback} dicts
        overall_score: Average score across all 5 answers

    Returns:
        Dict with keys: strengths, weaknesses, suggestions
    """
    answers_text = "\n\n".join([
        f"Q{i+1}: {a['question']}\nAnswer: {a['answer']}\nScore: {a['score']}/10\nFeedback: {a['feedback']}"
        for i, a in enumerate(answers)
    ])

    prompt = f"""You are a compliance training director reviewing a candidate's interview performance.

Standard: **{standard}**
Overall Score: **{overall_score:.1f}/10**

Interview Q&A Transcript:
{answers_text}

Based on all answers, provide a comprehensive performance summary.

Return ONLY valid JSON:
{{
  "strengths": [
    "<specific strength demonstrated in the interview>",
    "<another strength>"
  ],
  "weaknesses": [
    "<specific knowledge gap or weakness>",
    "<another weakness>"
  ],
  "suggestions": [
    "<actionable improvement suggestion>",
    "<another suggestion>",
    "<training recommendation>"
  ]
}}"""

    try:
        response = model.generate_content(prompt)
        result = _extract_json(response.text)

        return {
            "strengths": result.get("strengths", []),
            "weaknesses": result.get("weaknesses", []),
            "suggestions": result.get("suggestions", []),
        }

    except Exception as e:
        logger.error(f"Gemini generate_final_summary error: {e}")
        # Return graceful fallback
        return {
            "strengths": ["Completed the full interview assessment"],
            "weaknesses": ["Could not generate detailed analysis"],
            "suggestions": ["Review compliance documentation for this standard"],
        }
