import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "exam_evaluator.settings")
django.setup()

from apps.ocr_engine.services import OCRService
from apps.segmentation.services import SegmentationService
from apps.evaluator.services import AIEvaluationService

def debug_pipeline():
    file_name = '713323TS001_19IT701.pdf'
    # Use absolute path based on where we think the file is
    # It might be in root or media/exams/X/submissions.
    # Let's verify existence in current dir first as per previous list_dir
    file_path = os.path.join(os.getcwd(), file_name)
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    print(f"--- Processing {file_name} ---")

    # 1. OCR
    print("\n1. Running OCR (Full PDF)...")
    ocr_service = OCRService()
    try:
        text = ocr_service.process_file(file_path) # Process all pages
        print(f"OCR Extracted Text (First 2000 chars):\n{'-'*40}\n{text[:2000]}\n{'-'*40}")
        if not text:
            print("OCR returned empty text!")
            return
    except Exception as e:
        print(f"OCR Failed: {e}")
        return

    # 2. Segmentation
    print("\n2. Running Segmentation...")
    segment_service = SegmentationService()
    segments = segment_service.segment_answer(text)
    print(f"Found {len(segments)} segments.")
    for i, seg in enumerate(segments):
        print(f"  Segment {i+1}: Question {seg['question_no']} (Length: {len(seg['answer'])})")
        print(f"  Answer Preview: {seg['answer'][:100]}...")

    if not segments:
        print("No segments found. AI Evaluation will be skipped.")
        return

    # 3. AI Evaluation
    print("\n3. Running AI Evaluation (qwen2.5:1.5b)...")
    eval_service = AIEvaluationService(model="qwen2.5:1.5b")
    
    # Evaluate first segment only for demo
    seg = segments[0]
    q_no = seg['question_no']
    answer = seg['answer']
    
    print(f"Evaluating Question {q_no}...")
    result = eval_service.evaluate(
        question_text=f"Question {q_no}",
        answer_text=answer,
        rubric_text="Evaluate based on relevance.",
        max_marks=10
    )
    print(f"AI Result: {result}")

if __name__ == "__main__":
    debug_pipeline()
