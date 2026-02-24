"""
core/evaluator.py

LLM-based answer evaluator for the EduGrade AI system.

Calls Google Gemini using a strict college-level examiner prompt
to evaluate the entire exam (Question Paper + Rubrics + Answer Sheet)
in a single, unified call.
"""

import json
import logging
import re
import time
from typing import Any

from openai import OpenAI

from core.exceptions import EvaluationException

# ---------------------------------------------------------------------------
# Module-level logger
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

_JSON_FENCE_RE = re.compile(r"^```(?:json)?\s*\n?(.*?)\n?```$", re.DOTALL | re.IGNORECASE)

def _strip_json_fences(text: str) -> str:
    """Remove Markdown JSON code fences from *text* if present.

    Args:
        text: Raw string that may contain triple-backtick fences.

    Returns:
        Inner JSON string with fences removed, or *text* unchanged.
    """
    stripped = text.strip()
    m = _JSON_FENCE_RE.match(stripped)
    return m.group(1).strip() if m else stripped


def _build_evaluation_prompt(
    question_paper_text: str,
    rubrics_text: str,
    total_marks: int,
    student_answers_text: str,
    student_name: str,
) -> str:
    """Build the monolithic Anna University examiner prompt.

    Args:
        question_paper_text: Raw text extracted from the given question paper PDF.
        rubrics_text: Teacher's strict rubrics.
        total_marks: Max possible marks.
        student_answers_text: Raw concatenated OCR text from the student's sheet.
        student_name: Student name.

    Returns:
        Fully formatted prompt string exactly as defined by the unified requirement.
    """
    return f"""You are a strict college-level examiner for an Anna University affiliated B.E. Computer Science program.

You are evaluating ONE student's answer sheet.

You must follow the exact marking distribution defined in the rubrics.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GLOBAL EXAM DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUESTION PAPER:
{question_paper_text}

RUBRICS:
{rubrics_text}

TOTAL MARKS FOR EXAM:
{total_marks}

The rubrics may define marks using ranges such as:
"1 to 5 - 2 marks each"
"6 to 7 - 13 marks each"
"8 - 14 marks"

You must expand ranges properly before evaluation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STUDENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STUDENT NAME:
{student_name}

STUDENT ANSWERS:
{student_answers_text}
 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVALUATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Identify all question numbers from the question paper.
2. Derive exact max marks per question from rubrics.
3. Evaluate each answer strictly.
4. Award marks between 0 and max_marks.
5. Partial marks allowed, but MUST BE WHOLE NUMBERS ONLY (no decimals, no half marks). If an answer deserves 1.5, you must evaluate carefully and assign either 1 or 2 as an integer.
6. Missing answer → 0 marks.
7. Do not exceed max_marks.
8. Maintain consistent marking standard.
9. Compute:
   - total_marks_awarded
   - percentage
   - grade (use scale below)

GRADE SCALE:
O  = 91-100
A+ = 81-90
A  = 71-80
B+ = 61-70
B  = 51-60
RA = below 50

10. Provide:
   - mistakes per question
   - improvements per question
   - 2-3 sentence feedback per question
   - overall feedback (3-4 sentences)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT OUTPUT FORMAT (JSON ONLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON:

{{
  "student_name": "{student_name}",
  "question_results": {{
    "1": {{
      "awarded_marks": 2,
      "max_marks": 2,
      "mistakes": ["..."],
      "improvements": ["..."],
      "feedback": "..."
    }}
  }},
  "total_marks_awarded": 67,
  "total_marks": {total_marks},
  "percentage": 67.0,
  "grade": "B+",
  "overall_feedback": "Overall academic performance summary."
}}

No markdown.
No explanation.
Only JSON.
"""

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def evaluate_entire_exam(
    question_paper_text: str,
    rubrics_text: str,
    total_marks: int,
    student_answers_text: str,
    student_name: str,
    groq_api_key: str,
    model_name: str = "llama-3.3-70b-versatile",
) -> dict[str, Any]:
    """Evaluate the entire exam payload in a single call using Groq.

    Args:
        question_paper_text: Extracted text from Question Paper PDF.
        rubrics_text: Formatted rubric ranges from teacher.
        total_marks: Expected total marks.
        student_answers_text: Extracted raw text from OCR.
        student_name: Student name.
        groq_api_key: API Key for Groq.
        model_name: Groq model ID.

    Returns:
        Parsed JSON dictionary containing the entire evaluation.

    Raises:
        EvaluationException: On network, timeout, or JSON parsing failure.
    """
    if not student_answers_text.strip():
        logger.warning("evaluator: Student answers are empty. Groq may return all zeros.")

    prompt = _build_evaluation_prompt(
        question_paper_text=question_paper_text,
        rubrics_text=rubrics_text,
        total_marks=total_marks,
        student_answers_text=student_answers_text,
        student_name=student_name,
    )

    client = OpenAI(
        api_key=groq_api_key,
        base_url="https://api.groq.com/openai/v1",
    )

    logger.info("evaluator: sending single evaluation payload to Groq (%s)", model_name)
    start_ts = time.monotonic()
    
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a strict, objective academic examiner. Output strictly JSON without any markdown formatting wrappers."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        raw_text = response.choices[0].message.content.strip()
    except Exception as exc:
        raise EvaluationException(
            f"Groq evaluation failure: {exc}", original_error=exc
        ) from exc
    finally:
        elapsed = time.monotonic() - start_ts
        logger.info("evaluator: Groq evaluation completed in %.2f s", elapsed)

    if not raw_text:
        raise EvaluationException("Groq returned empty response.")

    clean_text = _strip_json_fences(raw_text)

    try:
        evaluation: dict = json.loads(clean_text)
    except json.JSONDecodeError as exc:
        raise EvaluationException(
            f"Groq response is not valid JSON: {clean_text[:200]!r}",
            original_error=exc,
        ) from exc

    if not isinstance(evaluation, dict):
        raise EvaluationException(f"Expected JSON object, got {type(evaluation).__name__}.")

    # --- Override LLM Arithmetic ---
    # LLMs frequently hallucinate summations. Force compute the true total in Python.
    actual_total_awarded = 0
    question_results = evaluation.get("question_results", {})
    for q_id, q_data in question_results.items():
        val = q_data.get("awarded_marks", 0)
        try:
            actual_total_awarded += float(val) if '.' in str(val) else int(val)
        except ValueError:
            pass
            
    # Force whole-number coercion again just in case
    actual_total_awarded = int(actual_total_awarded)
    
    # Recalculate Percentage
    safe_max_marks = max(total_marks, 1)
    actual_percentage = round((actual_total_awarded / safe_max_marks) * 100, 1)
    
    # Recalculate Grade based on prompt's scale
    actual_grade = "RA"
    if actual_percentage >= 91:
        actual_grade = "O"
    elif actual_percentage >= 81:
        actual_grade = "A+"
    elif actual_percentage >= 71:
        actual_grade = "A"
    elif actual_percentage >= 61:
        actual_grade = "B+"
    elif actual_percentage >= 51:
        actual_grade = "B"
        
    evaluation["total_marks_awarded"] = actual_total_awarded
    evaluation["percentage"] = actual_percentage
    evaluation["grade"] = actual_grade
    # --- End Override ---

    logger.info(
        "evaluator: success — Awarded %s/%s. Grade: %s",
        evaluation.get("total_marks_awarded", "?"),
        evaluation.get("total_marks", "?"),
        evaluation.get("grade", "?"),
    )
    
    return evaluation
