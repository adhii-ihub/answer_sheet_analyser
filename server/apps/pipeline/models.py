import json
from django.db import models
from django.utils.translation import gettext_lazy as _

class ExamSession(models.Model):
    """Represents a single Exam evaluation session initiated by a Teacher."""
    
    question_paper_file = models.FileField(upload_to="exams/question_papers/")
    rubrics_text = models.TextField()
    total_marks = models.PositiveIntegerField()
    student_limit = models.PositiveIntegerField(default=50)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Exam Session #{self.id} (Total Marks: {self.total_marks})"

class StudentAnswer(models.Model):
    """Represents a single student's submitted answer sheet for an Exam Session."""
    
    class Status(models.TextChoices):
        PENDING = "PENDING", _("Pending")
        PROCESSING = "PROCESSING", _("Processing")
        COMPLETED = "COMPLETED", _("Completed")
        FAILED = "FAILED", _("Failed")
        
    exam = models.ForeignKey(ExamSession, on_delete=models.CASCADE, related_name="students")
    student_name = models.CharField(max_length=255)
    answer_sheet_file = models.FileField(upload_to="exams/answer_sheets/")
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    error_message = models.TextField(blank=True, null=True)
    
    # Results (populated after evaluation)
    total_score = models.IntegerField(null=True, blank=True)
    percentage = models.FloatField(null=True, blank=True)
    grade = models.CharField(max_length=10, blank=True, null=True)
    marks_json = models.TextField(blank=True, null=True, help_text="Stores the raw resulting JSON for question-level breakdown")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.student_name} - {self.status}"
    
    def get_parsed_marks(self) -> dict:
        """Helper to return parsed JSON or empty dict."""
        if not self.marks_json:
            return {}
        try:
            return json.loads(self.marks_json)
        except json.JSONDecodeError:
            return {}
