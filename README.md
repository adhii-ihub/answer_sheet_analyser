# AI-Powered Exam Evaluation Platform - Backend

A Django REST API backend for AI-powered exam evaluation using local Ollama models (phi3 and llama3).

## 🚀 Features

- **JWT Authentication**: Secure user registration and login
- **File Upload**: Support for PDF and image formats (PNG, JPG, JPEG)
- **OCR Processing**: Automatic text extraction from uploaded files
- **AI Evaluation Pipeline**:
  - **phi3:mini**: Quick scoring (synchronous, ~2-3 seconds)
  - **llama3:8b**: Detailed feedback (asynchronous, ~10-30 seconds)
- **Analytics Engine**: Performance tracking and insights
- **Swagger UI**: Interactive API documentation
- **Celery**: Asynchronous task processing
- **Redis**: Message broker for Celery

## 📋 Prerequisites

- Python 3.10+
- Ollama installed and running
- Redis server
- Tesseract OCR (for image text extraction)

### Install Ollama Models

```bash
ollama pull phi3:mini
ollama pull llama3:8b
ollama list  # Verify models are installed
```

### Install Tesseract OCR

**Windows:**
```bash
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
# Add to PATH
```

**Linux:**
```bash
sudo apt-get install tesseract-ocr
```

**macOS:**
```bash
brew install tesseract
```

### Install Redis

**Windows:**
```bash
# Download from: https://github.com/microsoftarchive/redis/releases
# Or use WSL
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

## 🛠️ Installation

### 1. Create Virtual Environment

```bash
cd server
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/macOS:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment Configuration

```bash
# Copy example env file
copy .env.example .env

# Edit .env and update values as needed
```

### 5. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Create Superuser

```bash
python manage.py createsuperuser
```

## 🚀 Running the Application

### Start Redis (if not running)

```bash
redis-server
```

### Start Celery Worker

**Windows:**
```bash
celery -A exam_evaluator worker -l info --pool=solo
```

**Linux/macOS:**
```bash
celery -A exam_evaluator worker -l info
```

### Start Django Development Server

```bash
python manage.py runserver
```

## 📚 API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/
- **ReDoc**: http://localhost:8000/api/redoc/
- **JSON Schema**: http://localhost:8000/api/schema/
- **Admin Panel**: http://localhost:8000/admin/

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login and get JWT tokens
- `GET /api/auth/profile/` - Get user profile
- `POST /api/auth/token/refresh/` - Refresh access token

### Submissions
- `POST /api/upload/` - Upload exam files
- `GET /api/history/` - Get submission history
- `GET /api/submissions/<id>/` - Get submission details

### Analytics & Dashboard
- `GET /api/analytics/` - Get analytics data
- `GET /api/dashboard/` - Get dashboard summary

## 🔄 Evaluation Workflow

1. **Upload** → User uploads question paper, answer sheet, and rubric
2. **OCR Processing** → System extracts text from files (async)
3. **Quick Evaluation** → phi3:mini provides quick score (sync)
4. **Detailed Evaluation** → llama3:8b provides detailed feedback (async)
5. **Complete** → User can view full evaluation results

### Status Flow
```
uploading → processing → quick_done → complete
```

## 📊 Database Models

### User
- Extended Django AbstractUser
- Email uniqueness
- Isolated data per user

### Submission
- User (FK)
- Question, Answer, Rubric files
- Extracted text fields
- Status tracking
- Timestamps

### Evaluation
- Submission (OneToOne)
- Quick score & feedback (phi3)
- Final score & detailed feedback (llama3)
- JSON feedback structure

### AnalyticsCache (Optional)
- User (OneToOne)
- Cached analytics data
- Performance optimization

## 🧪 Testing the API

### 1. Register a User

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "password2": "SecurePass123!"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "SecurePass123!"
  }'
```

### 3. Upload Files

```bash
curl -X POST http://localhost:8000/api/upload/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "question_file=@question.pdf" \
  -F "answer_file=@answer.pdf" \
  -F "rubric_file=@rubric.pdf"
```

### 4. Check History

```bash
curl -X GET http://localhost:8000/api/history/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔧 Configuration

### Settings (exam_evaluator/settings.py)

```python
# Ollama Configuration
OLLAMA_HOST = 'http://localhost:11434'
PHI3_MODEL = 'phi3:mini'
LLAMA3_MODEL = 'llama3:8b'

# File Upload Limits
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg']

# Celery Configuration
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
```

## 📁 Project Structure

```
server/
├── exam_evaluator/          # Project settings
│   ├── settings.py
│   ├── urls.py
│   ├── celery.py
│   └── wsgi.py
├── users/                   # User authentication app
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   └── urls.py
├── evaluations/             # Evaluation app
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── tasks.py            # Celery tasks
│   ├── urls.py
│   └── utils/
│       ├── ocr.py          # OCR utilities
│       └── ai_service.py   # AI evaluation service
├── media/                   # Uploaded files
├── manage.py
└── requirements.txt
```

## 🐛 Troubleshooting

### Ollama Connection Error
```bash
# Check if Ollama is running
ollama list

# Start Ollama if needed
ollama serve
```

### Redis Connection Error
```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG
```

### Celery Not Processing Tasks
```bash
# Check Celery worker logs
# Ensure Redis is running
# Restart Celery worker
```

### OCR Not Working
```bash
# Verify Tesseract installation
tesseract --version

# Add Tesseract to PATH if needed
```

## 📝 License

MIT License

## 👥 Support

For issues and questions, please open an issue on GitHub.