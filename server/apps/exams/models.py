from django.db import models
from django.conf import settings
import os

def submission_upload_path(instance, filename):
    return f'exams/{instance.exam_session.id}/submissions/{filename}'

def question_paper_upload_path(instance, filename):
    return f'exams/{instance.id}/question_papers/{filename}'

class ExamSession(models.Model):
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exam_sessions')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    question_paper = models.FileField(upload_to=question_paper_upload_path, blank=True, null=True)
    rubric = models.TextField(help_text="Rubric text or instructions for the AI evaluator.", blank=True, null=True)
    
    # Configuration
    max_marks = models.FloatField(default=100.0)

    def __str__(self):
        return self.title

class StudentSubmission(models.Model):
    exam_session = models.ForeignKey(ExamSession, on_delete=models.CASCADE, related_name='submissions')
    student_name = models.CharField(max_length=255, blank=True, null=True, help_text="Extracted or manually entered student name")
    student_id = models.CharField(max_length=100, blank=True, null=True)
    file = models.FileField(upload_to=submission_upload_path)
    
    # State
    processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    # Extracted Text
    ocr_text = models.TextField(blank=True, null=True)
    
    # Results
    total_marks_awarded = models.FloatField(default=0.0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student_name or 'Unknown'} - {self.exam_session.title}"

class QuestionResult(models.Model):
    submission = models.ForeignKey(StudentSubmission, on_delete=models.CASCADE, related_name='question_results')
    question_no = models.CharField(max_length=50) # e.g. "Q1", "1a"
    question_text = models.TextField(blank=True, null=True) # If we can parse the question paper map
    answer_text = models.TextField(blank=True, null=True)
    
    marks_awarded = models.FloatField(default=0.0)
    max_marks = models.FloatField(blank=True, null=True) # if known per question
    feedback = models.TextField(blank=True, null=True)
    reason = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['question_no']

    def __str__(self):
        return f"{self.submission} - {self.question_no}"

class EvaluationSummary(models.Model):
    submission = models.OneToOneField(StudentSubmission, on_delete=models.CASCADE, related_name='summary')
    summary_text = models.TextField(blank=True, null=True)
    ai_confidence = models.FloatField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Summary for {self.submission}"
