"""
URL configuration for exam_evaluator project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Swagger/OpenAPI schema configuration
schema_view = get_schema_view(
    openapi.Info(
        title="AI Exam Evaluation API",
        default_version='v1',
        description="""
# AI-Powered Exam Evaluation Platform API

This API provides endpoints for uploading exam materials (question papers, answer sheets, and rubrics) 
and receiving AI-powered evaluations using local Ollama models.

## Features
- **Authentication**: JWT-based authentication
- **File Upload**: Support for PDF and image formats
- **AI Evaluation**: 
  - Quick scoring using phi3:mini (synchronous)
  - Detailed feedback using llama3:8b (asynchronous)
- **Analytics**: Performance tracking and insights
- **Dashboard**: Overview of submissions and scores

## Workflow
1. Register/Login to get JWT token
2. Upload question paper, answer sheet, and rubric
3. Receive quick evaluation (phi3)
4. Get detailed feedback when processing completes (llama3)
5. View analytics and history

## Models Used
- **phi3:mini**: Fast, lightweight model for quick scoring
- **llama3:8b**: Comprehensive model for detailed feedback
        """,
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="contact@exameval.local"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
    authentication_classes=[],
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Swagger UI
    path('', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='api-docs'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('api/schema/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    
    # API endpoints
    path('api/auth/', include('users.urls')),
    path('api/', include('evaluations.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
