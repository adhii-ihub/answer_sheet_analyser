import logging
import threading
import json
from django.conf import settings
from apps.pipeline.models import StudentAnswer
from core.pipeline import run_evaluation_pipeline

logger = logging.getLogger(__name__)

def _evaluate_student_task(student_id: int):
    """Background task to run the complete pipeline for a single student."""
    try:
        # Re-fetch from DB to ensure it hasn't changed.
        student: StudentAnswer = StudentAnswer.objects.get(id=student_id)
    except StudentAnswer.DoesNotExist:
        logger.error("background: StudentAnswer %d not found.", student_id)
        return

    student.status = StudentAnswer.Status.PROCESSING
    student.save(update_fields=["status"])

    exam = student.exam
    try:
        # Run the standard monolithic evaluation pipeline
        result = run_evaluation_pipeline(
            question_paper_path=exam.question_paper_file.path,
            answer_sheet_paths=[student.answer_sheet_file.path], # Only their sheet
            rubrics_text=exam.rubrics_text,
            student_name=student.student_name,
            total_marks=exam.total_marks,
            groq_api_key=settings.GROQ_API_KEY,
            ocr_service_url=settings.OCR_SERVICE_URL,
            ocr_api_key=settings.OCR_API_KEY,
            groq_model=settings.GROQ_MODEL,
        )
        
        # Unpack result
        student.total_score = result.get("total_marks_awarded")
        student.percentage = result.get("percentage")
        student.grade = result.get("grade")
        student.marks_json = json.dumps(result.get("question_results", {}))
        
        student.status = StudentAnswer.Status.COMPLETED
        student.save(update_fields=["total_score", "percentage", "grade", "marks_json", "status"])
        
        logger.info(f"background: Successfully evaluated Student {student_id}")

    except Exception as exc:
        logger.exception(f"background: Failed to evaluate Student {student_id}: {exc}")
        student.status = StudentAnswer.Status.FAILED
        student.error_message = str(exc)
        student.save(update_fields=["status", "error_message"])

def start_evaluation_for_exam(exam_id: int):
    """Kicks off a background thread for each pending student in the exam session."""
    pending_students = StudentAnswer.objects.filter(exam_id=exam_id, status=StudentAnswer.Status.PENDING)
    
    count = pending_students.count()
    if count == 0:
        logger.info(f"background: No pending students for Exam {exam_id}.")
        return

    logger.info(f"background: Dispatching {count} background threads for Exam {exam_id}.")
    
    for student in pending_students:
        # Start a lightweight daemon thread per student
        t = threading.Thread(target=_evaluate_student_task, args=(student.id,))
        t.daemon = True
        t.start()
