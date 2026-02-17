from django.db import models
from django.contrib.auth import get_user_model
import json

User = get_user_model()


class Exam(models.Model):
    """
    Model to store Exam context (Question Paper + Rubric).
    Allows reuse of these files for multiple submissions.
    """
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=100, blank=True)
    question_file = models.FileField(upload_to='questions/')
    rubric_file = models.FileField(upload_to='rubrics/', null=True, blank=True)
    
    # Extracted text (cached)
    question_text = models.TextField(blank=True)
    rubric_text = models.TextField(blank=True)
    
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='exams'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.subject})"
    
    class Meta:
        db_table = 'exams'
        ordering = ['-created_at']


class Submission(models.Model):
    """
    Model to store exam submission details.
    Each submission contains question paper, answer sheet, and rubric files.
    Now supports linking to an Exam context.
    """
    STATUS_CHOICES = [
        ('uploading', 'Uploading'),
        ('processing', 'Processing'),
        ('quick_done', 'Quick Evaluation Done'),
        ('complete', 'Complete'),
        ('failed', 'Failed'),
    ]
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='submissions'
    )
    
    # Link to Exam Context (Optional for backward compatibility)
    exam = models.ForeignKey(
        Exam,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='submissions'
    )
    
    student_name = models.CharField(max_length=255, default="Unknown Student")
    
    # Files
    # If linked to Exam, question_file and rubric_file can be null
    question_file = models.FileField(upload_to='questions/', null=True, blank=True)
    answer_file = models.FileField(upload_to='answers/')
    rubric_file = models.FileField(upload_to='rubrics/', null=True, blank=True)
    
    # Extracted text properties (fallback to Exam if missing)
    _question_text = models.TextField(blank=True, db_column='question_text')
    answer_text = models.TextField(blank=True)
    _rubric_text = models.TextField(blank=True, db_column='rubric_text')
    
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='uploading'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def question_text(self):
        return self._question_text or (self.exam.question_text if self.exam else "")
        
    @question_text.setter
    def question_text(self, value):
        self._question_text = value
        
    @property
    def rubric_text(self):
        return self._rubric_text or (self.exam.rubric_text if self.exam else "")
        
    @rubric_text.setter
    def rubric_text(self, value):
        self._rubric_text = value

    def __str__(self):
        return f"Submission {self.id} - {self.student_name}"
    
    class Meta:
        db_table = 'submissions'
        ordering = ['-created_at']


class Evaluation(models.Model):
    """
    Model to store AI evaluation results.
    Contains both quick score (phi3) and detailed feedback (llama3).
    """
    submission = models.OneToOneField(
        Submission, 
        on_delete=models.CASCADE, 
        related_name='evaluation'
    )
    
    # Quick evaluation (phi3)
    quick_score = models.FloatField(null=True, blank=True)
    quick_feedback = models.TextField(blank=True)
    
    # Detailed evaluation (llama3)
    final_score = models.FloatField(null=True, blank=True)
    feedback_json = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Evaluation for Submission {self.submission.id}"
    
    @property
    def strengths(self):
        """Get strengths from feedback JSON."""
        return self.feedback_json.get('strengths', [])
    
    @property
    def mistakes(self):
        """Get mistakes from feedback JSON."""
        return self.feedback_json.get('mistakes', [])
    
    @property
    def improvement_suggestions(self):
        """Get improvement suggestions from feedback JSON."""
        return self.feedback_json.get('improvement_suggestions', [])
    
    @property
    def detailed_feedback(self):
        """Get detailed feedback from feedback JSON."""
        # Gemini returns 'feedback', not 'detailed_feedback'
        return self.feedback_json.get('feedback', '') or self.feedback_json.get('detailed_feedback', '')
    
    @property
    def max_score(self):
        """Get max possible score from feedback JSON."""
        return self.feedback_json.get('max_score', None)
    
    @property
    def confidence(self):
        """Get confidence score from feedback JSON."""
        return self.feedback_json.get('confidence', None)
    
    class Meta:
        db_table = 'evaluations'
        ordering = ['-created_at']


class AnalyticsCache(models.Model):
    """
    Optional model to cache analytics calculations.
    Improves performance for frequently accessed analytics.
    """
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='analytics_cache'
    )
    
    total_submissions = models.IntegerField(default=0)
    average_score = models.FloatField(default=0.0)
    cache_data = models.JSONField(default=dict, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Analytics for {self.user.username}"
    
    class Meta:
        db_table = 'analytics_cache'
