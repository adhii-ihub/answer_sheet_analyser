@echo off
echo Starting AI Exam Evaluation Platform...
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
echo Starting Django Development Server
echo ========================================
echo.
echo Swagger UI: http://localhost:8000/
echo Admin Panel: http://localhost:8000/admin/
echo.
echo Press Ctrl+C to stop the server
echo.

python manage.py runserver
