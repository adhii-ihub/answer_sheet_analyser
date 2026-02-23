import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'exam_evaluator.settings')
django.setup()

from apps.ocr_engine.services import OCRService
from apps.segmentation.services import SegmentationService
from apps.evaluator.services import AIEvaluationService

def main():
    print("Testing Services...")
    
    # 1. OCR
    print("\n--- OCR Service ---")
    ocr_service = OCRService()
    # Use the PDF we verified earlier
    pdf_path = os.path.join(settings.BASE_DIR, '713323TS001_19IT701.pdf')
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        return

    print(f"Processing {pdf_path}...")
    # Process only first page for speed in test? 
    # But service processes whole file. Let it run, it might take a minute.
    # Alternatively, use a dummy image if we had one, but let's test the real PDF.
    try:
        text = ocr_service.process_file(pdf_path)
        print(f"OCR extracted {len(text)} characters.")
        print(f"Preview: {text[:200]}...")
    except Exception as e:
        print(f"OCR Failed: {e}")
        return

    # 2. Segmentation
    print("\n--- Segmentation Service ---")
    seg_service = SegmentationService()
    segments = seg_service.segment_answer(text)
    print(f"Segmented into {len(segments)} parts.")
    for i, seg in enumerate(segments[:3]): # Show first 3
        print(f"Segment {i+1}: {seg['question_no']} - {seg['answer'][:50]}...")

    # 3. AI Evaluation
    print("\n--- AI Evaluation Service ---")
    # Only test if Ollama is running
    try:
        import requests
        requests.get("http://localhost:11434")
    except:
        print("Ollama not running. Skipping AI test.")
        return

    eval_service = AIEvaluationService()
    if segments:
        first_seg = segments[0]
        print(f"Evaluating Question {first_seg['question_no']}...")
        result = eval_service.evaluate(
            question_text=f"Question {first_seg['question_no']}",
            answer_text=first_seg['answer'],
            rubric_text="Evaluate for clarity and correctness.",
            max_marks=10
        )
        print("Evaluation Result:")
        print(result)

if __name__ == "__main__":
    main()
