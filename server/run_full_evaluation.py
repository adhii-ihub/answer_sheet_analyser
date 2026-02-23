import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'exam_evaluator.settings')
django.setup()

from apps.ocr_engine.services import OCRService
from apps.segmentation.services import SegmentationService
from apps.evaluator.services import AIEvaluationService

def run_evaluation(answer_sheet_path, question_paper_path):
    print(f"--- Starting Evaluation ---")
    print(f"Answer Sheet: {answer_sheet_path}")
    print(f"Question Paper: {question_paper_path}")

    ocr_service = OCRService()
    segment_service = SegmentationService()
    eval_service = AIEvaluationService()

    # 1. OCR Answer Sheet
    print("\n1. Running OCR on Answer Sheet...")
    answer_text = ocr_service.process_file(answer_sheet_path)
    print("-" * 50)
    print("FULL ANSWER SHEET TEXT:")
    print("-" * 50)
    print(answer_text)
    print("-" * 50)

    # 2. OCR Question Paper (Optional but good for context)
    print("\n2. Running OCR on Question Paper...")
    question_paper_text = ocr_service.process_file(question_paper_path)
    print("-" * 50)
    print("FULL QUESTION PAPER TEXT:")
    print("-" * 50)
    print(question_paper_text)
    print("-" * 50)

    # 3. OCR Cleaning and Structuring (LLM-powered)
    print("\n3. Cleaning and Structuring OCR Text with LLM...")
    segments = eval_service.clean_and_structure_ocr(answer_text)
    
    if not segments:
        print("Warning: LLM failed to structure OCR text. Falling back to regex segmentation.")
        segments = segment_service.segment_answer(answer_text)
    
    print(f"Found {len(segments)} segments.")

    # 4. Evaluation
    print("\n4. Running AI Evaluation...")
    results = []
    for segment in segments:
        # Check if segment is a dictionary (it should be if AI returned correct JSON)
        if not isinstance(segment, dict):
            print(f"Warning: Skipping malformed segment: {segment}")
            continue
            
        q_no = segment.get('question_no', 'Unknown')
        student_answer = segment.get('answer', '')
        
        if not student_answer:
            print(f"Warning: Skipping segment {q_no} because answer is empty.")
            continue
            
        print(f"Evaluating {q_no}...")
        
        # Use a portion of the question paper text as context if needed, 
        # but for now we follow the existing service pattern
        evaluation = eval_service.evaluate(
            question_text=f"Context from Question Paper: {question_paper_text[:1000]}", 
            answer_text=student_answer,
            rubric_text="Evaluate based on technical accuracy and completeness.",
            max_marks=10
        )
        
        results.append({
            "question": q_no,
            "evaluation": evaluation
        })
        print(f"Result for {q_no}: {evaluation}")

    print("\n--- Evaluation Complete ---")
    return results

if __name__ == "__main__":
    answer_path = r"c:\Users\HP_2\Desktop\ADHII\answer_sheet_analyser\server\713323TS001_19IT701.pdf"
    question_path = r"c:\Users\HP_2\Desktop\ADHII\answer_sheet_analyser\server\ip iae2.pdf"
    
    if not os.path.exists(answer_path):
        print(f"Error: Answer sheet not found at {answer_path}")
        sys.exit(1)
    if not os.path.exists(question_path):
        print(f"Error: Question paper not found at {question_path}")
        sys.exit(1)
        
    run_evaluation(answer_path, question_path)
