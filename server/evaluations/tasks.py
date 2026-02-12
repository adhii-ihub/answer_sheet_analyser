"""
Celery tasks for asynchronous processing.
Handles OCR extraction and detailed AI evaluation.
"""
from celery import shared_task
from django.conf import settings
from .models import Submission, Evaluation
from .utils.ocr import extract_text_from_file
from .utils.ai_service import ai_service


@shared_task
def process_submission_files(submission_id):
    """
    Extract text from uploaded files using OCR.
    This task runs after file upload.
    """
    try:
        submission = Submission.objects.get(id=submission_id)
        submission.status = 'processing'
        submission.save()
        
        # Extract text from files
        submission.question_text = extract_text_from_file(submission.question_file.path)
        submission.answer_text = extract_text_from_file(submission.answer_file.path)
        submission.rubric_text = extract_text_from_file(submission.rubric_file.path)
        submission.save()
        
        # Trigger quick evaluation
        quick_evaluate_submission.delay(submission_id)
        
        return f"Successfully processed submission {submission_id}"
    except Exception as e:
        submission = Submission.objects.get(id=submission_id)
        submission.status = 'failed'
        submission.save()
        return f"Error processing submission {submission_id}: {str(e)}"


@shared_task
def quick_evaluate_submission(submission_id):
    """
    Perform quick evaluation using phi3:mini model.
    This is synchronous and fast.
    """
    try:
        submission = Submission.objects.get(id=submission_id)
        
        # Get or create evaluation
        evaluation, created = Evaluation.objects.get_or_create(submission=submission)
        
        # Perform quick evaluation
        result = ai_service.quick_evaluate(
            submission.question_text,
            submission.answer_text,
            submission.rubric_text
        )
        
        # Save results
        evaluation.quick_score = result['score']
        evaluation.quick_feedback = result['quick_feedback']
        evaluation.save()
        
        # Update submission status
        submission.status = 'quick_done'
        submission.save()
        
        # Trigger detailed evaluation in background
        detailed_evaluate_submission.delay(submission_id)
        
        return f"Quick evaluation completed for submission {submission_id}"
    except Exception as e:
        submission = Submission.objects.get(id=submission_id)
        submission.status = 'failed'
        submission.save()
        return f"Error in quick evaluation for submission {submission_id}: {str(e)}"


@shared_task
def detailed_evaluate_submission(submission_id):
    """
    Perform detailed evaluation using llama3:8b model.
    This is asynchronous and may take longer.
    """
    try:
        submission = Submission.objects.get(id=submission_id)
        evaluation = Evaluation.objects.get(submission=submission)
        
        # Perform detailed evaluation
        result = ai_service.detailed_evaluate(
            submission.question_text,
            submission.answer_text,
            submission.rubric_text
        )
        
        # Save results
        evaluation.final_score = result['final_score']
        evaluation.feedback_json = {
            'strengths': result['strengths'],
            'mistakes': result['mistakes'],
            'improvement_suggestions': result['improvement_suggestions'],
            'detailed_feedback': result['detailed_feedback']
        }
        evaluation.save()
        
        # Update submission status
        submission.status = 'complete'
        submission.save()
        
        return f"Detailed evaluation completed for submission {submission_id}"
    except Exception as e:
        submission = Submission.objects.get(id=submission_id)
        submission.status = 'failed'
        submission.save()
        return f"Error in detailed evaluation for submission {submission_id}: {str(e)}"
