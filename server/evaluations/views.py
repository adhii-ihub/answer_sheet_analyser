from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Avg, Count, Q
from django.utils import timezone
from datetime import timedelta
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import Submission, Evaluation
from .serializers import (
    SubmissionSerializer, 
    SubmissionCreateSerializer,
    SubmissionListSerializer
)
from .utils.gemini_service import gemini_service


class UploadView(generics.CreateAPIView):
    """
    API endpoint for uploading exam files.
    POST /api/upload
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = SubmissionCreateSerializer
    parser_classes = (MultiPartParser, FormParser)
    
    @swagger_auto_schema(
        operation_description="""
Upload question paper, answer sheet, and rubric files for AI evaluation.

**Workflow:**
1. Upload three files (PDF or images)
2. Files are sent to Gemini for multimodal evaluation
3. AI evaluates and provides scoring and feedback (synchronous)

**Supported formats:** PDF, PNG, JPG, JPEG  
**Max file size:** 10MB per file
        """,
        operation_summary="Upload Exam Files",
        tags=['Submissions'],
        manual_parameters=[
            openapi.Parameter(
                'question_file',
                openapi.IN_FORM,
                description="Question paper file (PDF or image)",
                type=openapi.TYPE_FILE,
                required=True
            ),
            openapi.Parameter(
                'answer_file',
                openapi.IN_FORM,
                description="Answer sheet file (PDF or image)",
                type=openapi.TYPE_FILE,
                required=True
            ),
            openapi.Parameter(
                'rubric_file',
                openapi.IN_FORM,
                description="Rubric/marking scheme file (PDF or image)",
                type=openapi.TYPE_FILE,
                required=True
            ),
        ],
        responses={
            201: SubmissionSerializer,
            400: "Bad Request - Invalid file format or size",
            401: "Unauthorized - Authentication required"
        }
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create submission
        submission = serializer.save(user=request.user)
        
        try:
            # Update status
            submission.status = 'processing'
            submission.save()
            
            # Placeholder for text fields since we use multimodal Gemini
            submission.question_text = "Processed by Gemini Multimodal"
            submission.answer_text = "Processed by Gemini Multimodal"
            submission.rubric_text = "Processed by Gemini Multimodal"
            submission.save()
            
            # Perform AI evaluation using Gemini
            result = gemini_service.evaluate(
                submission.question_file.path,
                submission.answer_file.path,
                submission.rubric_file.path
            )
            
            # Create evaluation record
            Evaluation.objects.create(
                submission=submission,
                quick_score=result.get('score', 0),
                quick_feedback=result.get('feedback', '')[:200], # Truncate for quick feedback field
                final_score=result.get('score', 0),
                feedback_json=result
            )
            
            submission.status = 'complete'
            submission.save()
            
            submission.status = 'complete'
            submission.save()
            
        except Exception as e:
            submission.status = 'failed'
            submission.save()
            return Response(
                {'error': f'Processing failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Return submission details
        response_serializer = SubmissionSerializer(submission)
        return Response(
            response_serializer.data, 
            status=status.HTTP_201_CREATED
        )


class HistoryView(generics.ListAPIView):
    """
    API endpoint to get user's submission history.
    GET /api/history
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = SubmissionListSerializer
    
    @swagger_auto_schema(
        operation_description="Get list of all submissions by the authenticated user",
        operation_summary="Get Submission History",
        tags=['Submissions'],
        responses={
            200: SubmissionListSerializer(many=True),
            401: "Unauthorized - Authentication required"
        }
    )
    def get_queryset(self):
        return Submission.objects.filter(
            user=self.request.user
        ).select_related('evaluation')


class SubmissionDetailView(generics.RetrieveAPIView):
    """
    API endpoint to get detailed submission information.
    GET /api/submissions/<id>
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = SubmissionSerializer
    
    @swagger_auto_schema(
        operation_description="Get detailed information about a specific submission including evaluation results",
        operation_summary="Get Submission Details",
        tags=['Submissions'],
        responses={
            200: SubmissionSerializer,
            401: "Unauthorized - Authentication required",
            404: "Not Found - Submission does not exist"
        }
    )
    def get_queryset(self):
        return Submission.objects.filter(
            user=self.request.user
        ).select_related('evaluation')


class AnalyticsView(APIView):
    """
    API endpoint for analytics data.
    GET /api/analytics
    """
    permission_classes = (IsAuthenticated,)
    
    @swagger_auto_schema(
        operation_description="""
Get comprehensive analytics for the authenticated user.

**Returns:**
- Total submissions count
- Average quick and final scores
- Score timeline (last 30 days)
- Performance distribution by score ranges
- Strengths vs weaknesses comparison
        """,
        operation_summary="Get Analytics Data",
        tags=['Analytics'],
        responses={
            200: openapi.Response(
                description="Analytics data",
                examples={
                    "application/json": {
                        "total_submissions": 15,
                        "average_quick_score": 75.5,
                        "average_final_score": 78.2,
                        "score_timeline": [
                            {
                                "date": "2024-01-15",
                                "quick_score": 75.0,
                                "final_score": 78.0
                            }
                        ],
                        "performance_distribution": {
                            "0-20": 0,
                            "21-40": 1,
                            "41-60": 3,
                            "61-80": 7,
                            "81-100": 4
                        },
                        "strengths_vs_weaknesses": {
                            "strengths": 45,
                            "weaknesses": 23
                        }
                    }
                }
            ),
            401: "Unauthorized - Authentication required"
        }
    )
    def get(self, request):
        user = request.user
        
        # Get all user submissions with evaluations
        submissions = Submission.objects.filter(
            user=user,
            status='complete'
        ).select_related('evaluation')
        
        # Calculate analytics
        total_submissions = submissions.count()
        
        # Calculate averages and distribution based on percentages
        total_quick_pct = 0
        total_final_pct = 0
        valid_quick_count = 0
        valid_final_count = 0
        
        score_ranges = {
            '0-20': 0,
            '21-40': 0,
            '41-60': 0,
            '61-80': 0,
            '81-100': 0
        }
        
        for sub in submissions:
            try:
                max_score = sub.evaluation.feedback_json.get('max_score', 100)
                if max_score <= 0: max_score = 100
                
                # Quick Score
                q_score = sub.evaluation.quick_score
                if q_score is not None:
                    q_pct = (q_score / max_score) * 100
                    total_quick_pct += q_pct
                    valid_quick_count += 1
                
                # Final Score
                f_score = sub.evaluation.final_score
                if f_score is not None:
                    f_pct = (f_score / max_score) * 100
                    total_final_pct += f_pct
                    valid_final_count += 1
                    
                    # Distribution
                    if f_pct <= 20: score_ranges['0-20'] += 1
                    elif f_pct <= 40: score_ranges['21-40'] += 1
                    elif f_pct <= 60: score_ranges['41-60'] += 1
                    elif f_pct <= 80: score_ranges['61-80'] += 1
                    else: score_ranges['81-100'] += 1
            except Exception:
                continue
                
        avg_quick_score = (total_quick_pct / valid_quick_count) if valid_quick_count > 0 else 0
        avg_final_score = (total_final_pct / valid_final_count) if valid_final_count > 0 else 0
        
        # Score timeline (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_submissions = submissions.filter(
            created_at__gte=thirty_days_ago
        ).order_by('created_at')
        
        score_timeline = []
        for sub in recent_submissions:
            try:
                max_score = sub.evaluation.feedback_json.get('max_score', 100) or 100
                q_score = sub.evaluation.quick_score
                f_score = sub.evaluation.final_score
                
                item = {'date': sub.created_at.strftime('%Y-%m-%d')}
                if q_score is not None:
                    item['quick_score'] = round((q_score / max_score) * 100, 1)
                if f_score is not None:
                    item['final_score'] = round((f_score / max_score) * 100, 1)
                
                score_timeline.append(item)
            except Exception:
                continue
        
        # Strengths vs Weaknesses
        total_strengths = 0
        total_mistakes = 0
        
        for sub in submissions:
            total_strengths += len(sub.evaluation.strengths)
            total_mistakes += len(sub.evaluation.mistakes)
        
        return Response({
            'total_submissions': total_submissions,
            'average_quick_score': round(avg_quick_score, 2),
            'average_final_score': round(avg_final_score, 2),
            'score_timeline': score_timeline,
            'performance_distribution': score_ranges,
            'strengths_vs_weaknesses': {
                'strengths': total_strengths,
                'weaknesses': total_mistakes
            }
        })


class DashboardView(APIView):
    """
    API endpoint for dashboard summary.
    GET /api/dashboard
    """
    permission_classes = (IsAuthenticated,)
    
    @swagger_auto_schema(
        operation_description="""
Get dashboard summary for the authenticated user.

**Returns:**
- Total uploads count
- Average final score
- Recent submissions (last 5)
- Pending evaluations count
        """,
        operation_summary="Get Dashboard Summary",
        tags=['Dashboard'],
        responses={
            200: openapi.Response(
                description="Dashboard data",
                examples={
                    "application/json": {
                        "total_uploads": 15,
                        "average_score": 78.5,
                        "recent_submissions": [
                            {
                                "id": 5,
                                "status": "complete",
                                "quick_score": 75.0,
                                "final_score": 78.0,
                                "created_at": "2024-01-15T10:30:00Z",
                                "updated_at": "2024-01-15T10:35:00Z"
                            }
                        ],
                        "pending_evaluations": 2
                    }
                }
            ),
            401: "Unauthorized - Authentication required"
        }
    )
    def get(self, request):
        user = request.user
        
        # Total uploads
        total_uploads = Submission.objects.filter(user=user).count()
        
        # Average score (calculated as percentage)
        completed_submissions = Submission.objects.filter(
            user=user,
            status='complete'
        ).select_related('evaluation')
        
        total_score_sum = 0
        count = 0
        
        for sub in completed_submissions:
            try:
                # Get max score from JSON or default to 100
                max_score = sub.evaluation.feedback_json.get('max_score', 100)
                final_score = sub.evaluation.final_score or 0
                
                if max_score > 0:
                    percentage = (final_score / max_score) * 100
                    total_score_sum += percentage
                    count += 1
            except Exception:
                continue
                
        avg_score = (total_score_sum / count) if count > 0 else 0
        
        # Recent submissions (last 10)
        recent_submissions = Submission.objects.filter(
            user=user
        ).select_related('evaluation').order_by('-created_at')[:10]
        
        recent_data = SubmissionListSerializer(recent_submissions, many=True).data
        
        # Pending evaluations
        pending_count = Submission.objects.filter(
            user=user,
            status__in=['uploading', 'processing', 'quick_done']
        ).count()
        
        return Response({
            'total_uploads': total_uploads,
            'average_score': round(avg_score, 0),
            'recent_submissions': recent_data,
            'pending_evaluations': pending_count
        })
