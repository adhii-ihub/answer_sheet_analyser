# AI Exam Evaluation Platform - Backend

## 🎉 Project Complete & Tested!

A Django REST API backend for AI-powered exam evaluation using Ollama models.

---

## ✅ Features

- **JWT Authentication** - Secure user registration and login
- **File Upload** - Support for PDF and image formats (PNG, JPG, JPEG)
- **OCR Text Extraction** - Tesseract OCR for extracting text from documents
- **AI Evaluation** - Synchronous AI evaluation using Ollama:
  - `phi3:latest` - Fast and accurate evaluation
  - `llama3:latest` - Comprehensive feedback
- **Analytics Dashboard** - Track submissions, scores, and performance
- **Swagger UI** - Interactive API documentation at http://localhost:8000/

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
copy .env.example .env
# Edit .env if needed
```

### 3. Run Migrations
```bash
python manage.py migrate
python manage.py createsuperuser
```

### 4. Start Server
```bash
python manage.py runserver
```

### 5. Access Swagger UI
Open: **http://localhost:8000/**

---

## 🔐 Authentication

### Login via Swagger UI:
1. Go to `POST /api/auth/login/`
2. Enter credentials
3. Copy the `access` token
4. Click **"Authorize"** button (top right)
5. Enter: `Bearer YOUR_ACCESS_TOKEN`
6. Test protected endpoints!

### Default Admin:
- Username: `admin`
- Password: `admin123`

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register/` - Register user
- `POST /api/auth/login/` - Login
- `GET /api/auth/profile/` - Get profile
- `POST /api/auth/token/refresh/` - Refresh token

### Submissions
- `POST /api/upload/` - Upload exam files (synchronous evaluation)
- `GET /api/history/` - List submissions
- `GET /api/submissions/{id}/` - Get details

### Analytics
- `GET /api/dashboard/` - Dashboard summary
- `GET /api/analytics/` - Full analytics

---

## 🧪 Testing

### Automated Test
```bash
cd server
venv\Scripts\activate
python test_api.py
```

### Manual Test via Swagger
1. Open http://localhost:8000/
2. Test authentication endpoints
3. Upload files
4. View results

---

## ⚙️ Configuration

### Required Services

**Tesseract OCR:**
- Path: `C:\Program Files\Tesseract-OCR\tesseract.exe`
- Configured in `.env`

**Ollama:**
- Host: `http://localhost:11434`
- Models: `phi3:latest`, `llama3:latest`
- Verify: `ollama list`

---

## 📁 Project Structure

```
server/
├── exam_evaluator/          # Django project
│   ├── settings.py          # Configuration
│   └── urls.py              # URL routing + Swagger
├── users/                   # Authentication app
│   ├── models.py            # User model
│   ├── views.py             # Auth endpoints
│   └── serializers.py       # DRF serializers
├── evaluations/             # Main app
│   ├── models.py            # Submission, Evaluation models
│   ├── views.py             # API endpoints
│   ├── serializers.py       # DRF serializers
│   └── utils/
│       ├── ocr.py           # OCR utilities
│       └── ai_service.py    # AI evaluation
├── manage.py                # Django CLI
├── requirements.txt         # Dependencies
├── .env                     # Environment config
└── test_api.py              # API test script
```

---

## 🛠️ Tech Stack

- **Framework:** Django 5.0 + Django REST Framework
- **Authentication:** JWT (simplejwt)
- **API Docs:** drf-yasg (Swagger/OpenAPI)
- **OCR:** Tesseract + PyPDF2
- **AI:** Ollama (phi3, llama3)
- **Database:** SQLite (dev) / PostgreSQL (prod)

---

## 📝 License

MIT License

---

**Built with ❤️ using Django and Ollama**