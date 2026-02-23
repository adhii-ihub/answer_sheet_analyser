"""
core/parser.py

Rubric parser for the EduGrade AI system.

Parses a plain-text rubric document into a structured dictionary that can
be consumed by the evaluator.  Supports question IDs such as ``1``, ``6a``,
``8b``, etc.

Expected rubric format (case-insensitive)::

    Q1 [2 marks]: Define form validation
    - 1 mark: correct definition
    - 1 mark: use in web development

    Q6a [12 marks]: Explain OSI model
    - 4 marks: list all 7 layers
    - 4 marks: describe functions
    - 4 marks: practical examples
"""

import re
import logging
from typing import Any

from core.exceptions import RubricParseException

# ---------------------------------------------------------------------------
# Module-level logger
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Compiled regular expressions (module-level for performance)
# ---------------------------------------------------------------------------

# Matches:   Q1 [2 marks]: Define form validation
#            Q6a [12 marks]: Explain OSI model
_QUESTION_RE = re.compile(
    r"^Q(\w+)\s*\[(\d+)\s+marks?\]\s*:\s*(.+)$",
    re.IGNORECASE,
)

# Matches:   - 1 mark: correct definition
#            - 4 marks: list all 7 layers
_CRITERIA_RE = re.compile(
    r"^-\s*(.+)$",
    re.IGNORECASE,
)

# Extracts leading integer from a criteria line, e.g. "4 marks: describe …" → 4
_MARKS_IN_CRITERIA_RE = re.compile(
    r"(\d+)\s*marks?",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def parse_rubrics(text: str) -> dict[str, dict[str, Any]]:
    """Parse a plain-text rubric document and return a structured dictionary.

    The function scans *text* line-by-line.  Each line that matches the
    ``Q<id> [<n> marks]: <description>`` pattern starts a new question block.
    Subsequent lines that begin with ``-`` are treated as individual marking
    criteria belonging to the most recent question.

    Args:
        text: Raw rubric text as a multi-line string.

    Returns:
        A dictionary keyed by normalised question ID (string, lower-cased),
        e.g.::

            {
                "1": {
                    "q_number": "1",
                    "max_marks": 2,
                    "description": "Define form validation",
                    "criteria": [
                        {"text": "correct definition", "marks": 1},
                        {"text": "use in web development", "marks": 1},
                    ],
                },
                "6a": { ... },
            }

    Raises:
        RubricParseException: If *text* contains no recognisable question
            blocks.
    """
    if not text or not text.strip():
        raise RubricParseException("Rubric text is empty or whitespace-only.")

    rubrics: dict[str, dict[str, Any]] = {}
    current_key: str | None = None

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        # ---- Try to match a question header --------------------------------
        q_match = _QUESTION_RE.match(line)
        if q_match:
            q_id = q_match.group(1).lower()      # normalise to lower-case
            max_marks = int(q_match.group(2))
            description = q_match.group(3).strip()

            rubrics[q_id] = {
                "q_number": q_id,
                "max_marks": max_marks,
                "description": description,
                "criteria": [],
            }
            current_key = q_id
            logger.debug("Parsed question Q%s (%d marks): %s", q_id, max_marks, description)
            continue

        # ---- Try to match a criteria line ----------------------------------
        c_match = _CRITERIA_RE.match(line)
        if c_match and current_key is not None:
            criteria_text = c_match.group(1).strip()

            # Extract the mark value from the criteria text itself
            marks_match = _MARKS_IN_CRITERIA_RE.search(criteria_text)
            marks = int(marks_match.group(1)) if marks_match else 0

            rubrics[current_key]["criteria"].append({
                "text": criteria_text,
                "marks": marks,
            })
            logger.debug(
                "  → criteria for Q%s (%d marks): %s",
                current_key,
                marks,
                criteria_text,
            )

    if not rubrics:
        raise RubricParseException(
            "No valid question blocks found in the rubric text. "
            "Expected format:  Q<id> [<n> marks]: <description>"
        )

    logger.info("parse_rubrics: parsed %d question(s) from rubric.", len(rubrics))
    return rubrics


# ---------------------------------------------------------------------------
# Built-in unit tests
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    """5 self-contained unit tests for parse_rubrics().

    Run with:
        python -m core.parser
    """

    passed = 0

    # ------------------------------------------------------------------
    # Test 1: Basic single question, two criteria
    # ------------------------------------------------------------------
    rubric_t1 = """
Q1 [2 marks]: Define form validation
- 1 mark: correct definition
- 1 mark: use in web development
"""
    result = parse_rubrics(rubric_t1)
    assert "1" in result, "T1: key '1' missing"
    assert result["1"]["max_marks"] == 2, "T1: max_marks mismatch"
    assert result["1"]["description"] == "Define form validation", "T1: description mismatch"
    assert len(result["1"]["criteria"]) == 2, "T1: criteria count mismatch"
    assert result["1"]["criteria"][0]["marks"] == 1, "T1: criteria[0].marks wrong"
    print("✓ Test 1 passed: basic single question")
    passed += 1

    # ------------------------------------------------------------------
    # Test 2: Alphanumeric question ID (6a / 6b) and high mark values
    # ------------------------------------------------------------------
    rubric_t2 = """
Q6a [12 marks]: Explain OSI model
- 4 marks: list all 7 layers
- 4 marks: describe functions
- 4 marks: practical examples

Q6b [8 marks]: Compare TCP and UDP
- 4 marks: key differences
- 4 marks: use-case examples
"""
    result = parse_rubrics(rubric_t2)
    assert "6a" in result, "T2: key '6a' missing"
    assert "6b" in result, "T2: key '6b' missing"
    assert result["6a"]["max_marks"] == 12, "T2: 6a max_marks wrong"
    assert result["6b"]["max_marks"] == 8, "T2: 6b max_marks wrong"
    assert len(result["6a"]["criteria"]) == 3, "T2: 6a criteria count wrong"
    print("✓ Test 2 passed: alphanumeric question IDs (6a, 6b)")
    passed += 1

    # ------------------------------------------------------------------
    # Test 3: Case-insensitive question header
    # ------------------------------------------------------------------
    rubric_t3 = "q5 [5 Marks]: Describe TCP/IP\n- 5 marks: full explanation"
    result = parse_rubrics(rubric_t3)
    assert "5" in result, "T3: key '5' missing (case-insensitive)"
    assert result["5"]["max_marks"] == 5, "T3: max_marks wrong"
    print("✓ Test 3 passed: case-insensitive question header")
    passed += 1

    # ------------------------------------------------------------------
    # Test 4: Multiple questions, mixed alphanumeric IDs
    # ------------------------------------------------------------------
    rubric_t4 = """
Q7a [10 marks]: Explain DBMS normalisation
- 5 marks: first three normal forms
- 5 marks: examples with tables

Q8b [15 marks]: Write SQL queries
- 5 marks: SELECT with joins
- 5 marks: aggregation functions
- 5 marks: subqueries
"""
    result = parse_rubrics(rubric_t4)
    assert len(result) == 2, "T4: expected 2 questions"
    assert result["7a"]["max_marks"] == 10, "T4: 7a max_marks wrong"
    assert result["8b"]["max_marks"] == 15, "T4: 8b max_marks wrong"
    assert result["8b"]["criteria"][2]["marks"] == 5, "T4: 8b last criteria marks wrong"
    print("✓ Test 4 passed: multiple mixed-ID questions")
    passed += 1

    # ------------------------------------------------------------------
    # Test 5: Empty / invalid rubric raises RubricParseException
    # ------------------------------------------------------------------
    try:
        parse_rubrics("This has no question blocks at all.")
        assert False, "T5: expected RubricParseException but none raised"
    except RubricParseException as exc:
        assert "No valid question blocks" in str(exc), "T5: wrong exception message"
        print("✓ Test 5 passed: invalid rubric raises RubricParseException")
        passed += 1

    # ------------------------------------------------------------------
    print(f"\nAll {passed} tests passed. ✓")
