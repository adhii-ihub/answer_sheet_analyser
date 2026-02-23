from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import ExamSessionSerializer
from apps.exams.models import StudentSubmission
from apps.ocr_engine.services import OCRService
from apps.segmentation.services import SegmentationService
from apps.evaluator.services import AIEvaluationService
import threading

class ProcessExamThread(threading.Thread):
    def __init__(self, exam_session):
        self.exam_session = exam_session
        self.ocr_service = OCRService()
        self.segment_service = SegmentationService()
        self.eval_service = AIEvaluationService()
        super().__init__()

    def run(self):
        submissions = self.exam_session.submissions.all()
        for submission in submissions:
            try:
                # 1. OCR (Full PDF / Image) — returns list of {"page": N, "text": "..."}
                print(f"DEBUG: Processing submission {submission.id} with file {submission.file.path}")
                ocr_pages = self.ocr_service.process_file(submission.file.path)

                # Join all pages into a single text block for downstream processing
                text = "\n".join(page["text"] for page in ocr_pages if page.get("text"))
                print(f"DEBUG: OCR Extracted Text ({len(ocr_pages)} pages):\n{text[:500]}...")

                submission.ocr_text = text
                submission.processed = True
                submission.save()
                
                # 2. Segment
                segments = self.segment_service.segment_answer(text)
                print(f"DEBUG: Found {len(segments)} segments.")
                
                # 3. Evaluate
                total_marks = 0
                for segment in segments:
                    q_no = segment['question_no']
                    answer = segment['answer']
                    print(f"DEBUG: Evaluating Question {q_no}...")
                    
                    # Assume simple max marks logic for now (e.g. 10 per question or split evenly)
                    # Or extract from question paper if possible.
                    # For MVP, let's say 10 marks per question or derive from total max marks / num questions
                    q_marks = 10 # Default
                    
                    evaluation = self.eval_service.evaluate(
                        question_text=f"Question {q_no}",
                        answer_text=answer,
                        rubric_text=self.exam_session.rubric,
                        max_marks=q_marks
                    )
                    
                    print(f"DEBUG: AI Evaluation Result for {q_no}: {evaluation}")
                    marks = evaluation.get('marks_awarded', 0)
                    total_marks += marks
                    
                    # Save Result
                    submission.question_results.create(
                        question_no=q_no,
                        question_text=f"Question {q_no}",
                        answer_text=answer,
                        marks_awarded=marks,
                        feedback=evaluation.get('feedback', ''),
                        reason=evaluation.get('reason', '')
                    )
                
                submission.total_marks_awarded = total_marks
                submission.save()
                
            except Exception as e:
                print(f"Error processing submission {submission.id}: {e}")

class UploadExamsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        serializer = ExamSessionSerializer(data=request.data)
        if serializer.is_valid():
            # Inject teacher from request
            serializer.validated_data['teacher'] = request.user
            exam_session = serializer.save()
            
            # Start background processing
            # Using Thread for simple async. In prod, use Celery.
            ProcessExamThread(exam_session).start()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
