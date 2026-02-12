@echo off
echo Starting Celery Worker...
echo.

cd server

echo Checking virtual environment...
if not exist venv (
    echo ERROR: Virtual environment not found!
    echo Please run setup_backend.bat first
    pause
    exit /b 1
)

echo Activating virtual environment...
call venv\Scripts\activate

echo.
echo ========================================
echo Starting Celery Worker
echo ========================================
echo.
echo This worker will process:
echo - OCR text extraction
echo - AI evaluations (phi3 and llama3)
echo.
echo Press Ctrl+C to stop the worker
echo.

celery -A exam_evaluator worker -l info --pool=solo
