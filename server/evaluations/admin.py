from django.contrib import admin
from .models import Submission, Evaluation, AnalyticsCache


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    """Admin interface for Submission model."""
    list_display = ('id', 'user', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    """Admin interface for Evaluation model."""
    list_display = ('id', 'submission', 'quick_score', 'final_score', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('submission__user__username',)
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)


@admin.register(AnalyticsCache)
class AnalyticsCacheAdmin(admin.ModelAdmin):
    """Admin interface for AnalyticsCache model."""
    list_display = ('user', 'total_submissions', 'average_score', 'updated_at')
    search_fields = ('user__username',)
    readonly_fields = ('updated_at',)
