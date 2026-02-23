from django.urls import path
from .views import UploadExamsView

urlpatterns = [
    path('upload-exams/', UploadExamsView.as_view(), name='upload_exams'),
]
