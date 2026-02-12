from django.db import models
from django.contrib.auth import get_user_model
import json

User = get_user_model()


class Submission(models.Model):
    """
    Model to store exam submission details.
    Each submission contains question paper, answer sheet, and rubric files.
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
    question_file = models.FileField(upload_to='questions/')
    answer_file = models.FileField(upload_to='answers/')
    rubric_file = models.FileField(upload_to='rubrics/')
    
    # Extracted text from files
    question_text = models.TextField(blank=True)
    answer_text = models.TextField(blank=True)
    rubric_text = models.TextField(blank=True)
    
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='uploading'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Submission {self.id} by {self.user.username}"
    
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
        return self.feedback_json.get('detailed_feedback', '')
    
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
