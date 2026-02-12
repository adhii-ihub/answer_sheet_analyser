# 🚀 Quick Reference - AI Exam Evaluation Platform

## ⚡ Quick Start Commands

### Setup (First Time Only)
```bash
# Automated setup
setup_backend.bat

# Manual setup
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

### Start Application (Every Time)
```bash
# Terminal 1: Django Server
start_server.bat

# Terminal 2: Celery Worker
start_celery.bat

# Terminal 3: Redis (if not running as service)
redis-server
```

### Access URLs
- **Swagger UI**: http://localhost:8000/
- **Admin Panel**: http://localhost:8000/admin/
- **ReDoc**: http://localhost:8000/api/redoc/

---

## 📋 Common Commands

### Django Management
```bash
cd server
venv\Scripts\activate

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Django shell
python manage.py shell

# Collect static files
python manage.py collectstatic
```

### Celery Commands
```bash
cd server
venv\Scripts\activate

# Start worker (Windows)
celery -A exam_evaluator worker -l info --pool=solo

# Start worker (Linux/Mac)
celery -A exam_evaluator worker -l info

# Purge all tasks
celery -A exam_evaluator purge

# Check active tasks
celery -A exam_evaluator inspect active
```

### Ollama Commands
```bash
# List installed models
ollama list

# Pull models
ollama pull phi3:mini
ollama pull llama3:8b

# Start Ollama server
ollama serve

# Test model
ollama run phi3:mini "Hello"
```

### Redis Commands
```bash
# Start Redis server
redis-server

# Check Redis connection
redis-cli ping

# Monitor Redis
redis-cli monitor

# Flush all data
redis-cli flushall
```

---

## 🧪 Testing Commands

### cURL Examples

#### Register User
```bash
curl -X POST http://localhost:8000/api/auth/register/ ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"Pass123!\",\"password2\":\"Pass123!\"}"
```

#### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser\",\"password\":\"Pass123!\"}"
```

#### Upload Files
```bash
curl -X POST http://localhost:8000/api/upload/ ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -F "question_file=@question.pdf" ^
  -F "answer_file=@answer.pdf" ^
  -F "rubric_file=@rubric.pdf"
```

#### Get History
```bash
curl -X GET http://localhost:8000/api/history/ ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Dashboard
```bash
curl -X GET http://localhost:8000/api/dashboard/ ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔍 Debugging Commands

### Check Python Version
```bash
python --version
```

### Check Installed Packages
```bash
pip list
pip show django
```

### Check Database
```bash
cd server
venv\Scripts\activate
python manage.py dbshell
```

### View Logs
```bash
# Django logs (in console)
python manage.py runserver

# Celery logs (in console)
celery -A exam_evaluator worker -l debug
```

### Test Imports
```bash
python manage.py shell
>>> from evaluations.utils.ai_service import ai_service
>>> from evaluations.utils.ocr import extract_text_from_file
>>> print("Imports successful!")
```

---

## 🛠️ Maintenance Commands

### Update Dependencies
```bash
cd server
venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt --upgrade
pip freeze > requirements.txt
```

### Clear Cache
```bash
# Clear Python cache
find . -type d -name __pycache__ -exec rm -r {} +

# Clear migrations (careful!)
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete
```

### Database Reset
```bash
cd server
venv\Scripts\activate

# Delete database
del db.sqlite3

# Recreate
python manage.py migrate
python manage.py createsuperuser
```

### Clear Media Files
```bash
cd server
rmdir /s /q media
mkdir media\questions
mkdir media\answers
mkdir media\rubrics
```

---

## 📊 Status Checks

### Check All Services
```bash
# Django
curl http://localhost:8000/api/dashboard/

# Redis
redis-cli ping

# Ollama
ollama list

# Celery (check logs in terminal)
```

### Check Submission Status
```bash
# Via API
curl -X GET http://localhost:8000/api/history/ ^
  -H "Authorization: Bearer YOUR_TOKEN"

# Via Django shell
python manage.py shell
>>> from evaluations.models import Submission
>>> Submission.objects.all().values('id', 'status')
```

---

## 🔐 Security Commands

### Change Secret Key
```bash
# Generate new secret key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Update in .env file
SECRET_KEY=new_generated_key
```

### Create API Token
```bash
python manage.py shell
>>> from users.models import User
>>> user = User.objects.get(username='testuser')
>>> from rest_framework_simplejwt.tokens import RefreshToken
>>> refresh = RefreshToken.for_user(user)
>>> print(f"Access: {refresh.access_token}")
>>> print(f"Refresh: {refresh}")
```

---

## 📦 Deployment Commands

### Collect Static Files
```bash
python manage.py collectstatic --noinput
```

### Check Deployment Readiness
```bash
python manage.py check --deploy
```

### Create Requirements
```bash
pip freeze > requirements.txt
```

---

## 🆘 Emergency Commands

### Kill All Python Processes
```bash
taskkill /F /IM python.exe
```

### Reset Everything
```bash
# Delete virtual environment
rmdir /s /q server\venv

# Delete database
del server\db.sqlite3

# Delete media files
rmdir /s /q server\media

# Run setup again
setup_backend.bat
```

---

## 💡 Useful Aliases (Optional)

Add to your shell profile for quick access:

```bash
# Windows (PowerShell profile)
function Start-ExamEval {
    cd C:\Users\HP_2\Desktop\ADHII\answer_sheet_analyser
    start cmd /k "start_server.bat"
    start cmd /k "start_celery.bat"
}

# Usage
Start-ExamEval
```

---

## 📝 Environment Variables

Key variables in `.env`:

```bash
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
OLLAMA_HOST=http://localhost:11434
CELERY_BROKER_URL=redis://localhost:6379/0
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

---

## 🎯 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 8000 in use | `netstat -ano \| findstr :8000` then `taskkill /PID <pid> /F` |
| Ollama not found | Check if Ollama is in PATH, restart terminal |
| Redis connection error | Start Redis: `redis-server` |
| Celery not processing | Restart worker, check Redis connection |
| Import errors | `pip install -r requirements.txt --force-reinstall` |
| Migration errors | `python manage.py migrate --run-syncdb` |

---

**📌 Bookmark this file for quick reference!**
