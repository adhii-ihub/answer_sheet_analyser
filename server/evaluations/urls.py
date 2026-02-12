from django.urls import path
from .views import (
    UploadView,
    HistoryView,
    SubmissionDetailView,
    AnalyticsView,
    DashboardView
)

urlpatterns = [
    path('upload/', UploadView.as_view(), name='upload'),
    path('history/', HistoryView.as_view(), name='history'),
    path('submissions/<int:pk>/', SubmissionDetailView.as_view(), name='submission-detail'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
]
