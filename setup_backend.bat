@echo off
echo ========================================
echo AI Exam Evaluation Platform - Setup
echo ========================================
echo.

cd server

echo [1/7] Creating virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)
echo ✓ Virtual environment created
echo.

echo [2/7] Activating virtual environment...
call venv\Scripts\activate
echo ✓ Virtual environment activated
echo.

echo [3/7] Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo [4/7] Setting up environment file...
if not exist .env (
    copy .env.example .env
    echo ✓ Created .env file from template
    echo ⚠ Please edit .env file with your configuration
) else (
    echo ✓ .env file already exists
)
echo.

echo [5/7] Running database migrations...
python manage.py makemigrations
python manage.py migrate
if %errorlevel% neq 0 (
    echo ERROR: Failed to run migrations
    pause
    exit /b 1
)
echo ✓ Database migrations completed
echo.

echo [6/7] Collecting static files...
python manage.py collectstatic --noinput
echo ✓ Static files collected
echo.

echo [7/7] Creating superuser...
echo.
echo Please create an admin account:
python manage.py createsuperuser
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Ensure Ollama is running with models:
echo    - ollama pull phi3:mini
echo    - ollama pull llama3:8b
echo.
echo 2. Start Redis server
echo.
echo 3. Start Celery worker (in new terminal):
echo    cd server
echo    venv\Scripts\activate
echo    celery -A exam_evaluator worker -l info --pool=solo
echo.
echo 4. Start Django server (in new terminal):
echo    cd server
echo    venv\Scripts\activate
echo    python manage.py runserver
echo.
echo 5. Access Swagger UI at: http://localhost:8000/
echo.
pause
