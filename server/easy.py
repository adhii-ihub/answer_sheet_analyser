import os
import time
import django

def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "exam_evaluator.settings")
    django.setup()

    from apps.ocr_engine.services import OCRService

    # Construct the absolute path to the image/pdf
    # file_name = 'answer.png'
    file_name = "713323TS001_19IT701.pdf"  # Example PDF
    file_path = os.path.join(os.path.dirname(__file__), "media", "answers", file_name)

    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        raise SystemExit(1)

    ocr_service = OCRService()

    start_time = time.time()
    text = ocr_service.process_file(file_path, max_pages=3)
    end_time = time.time()

    print("\nExtracted Text (first 3 pages):\n")
    print(text)
    print(f"\nTime taken: {end_time - start_time:.2f} seconds")

if __name__ == "__main__":
    main()