---
description: Setup AI Exam Evaluation Platform
---

# AI Exam Evaluation Platform Setup Workflow

## Phase 1: Backend Setup (Django)

### 1. Initialize Django Project
```bash
cd server
python -m venv venv
venv\Scripts\activate
pip install django djangorestframework djangorestframework-simplejwt pillow pytesseract celery redis python-dotenv ollama
pip freeze > requirements.txt
django-admin startproject exam_evaluator .
python manage.py startapp evaluations
python manage.py startapp users
```

### 2. Configure Django Settings
- Add apps to INSTALLED_APPS
- Configure JWT authentication
- Setup media files
- Configure CORS
- Setup Celery for async tasks

### 3. Create Models
- User model (extend AbstractUser)
- Submission model
- Evaluation model
- Analytics cache model

### 4. Create API Endpoints
- Authentication endpoints
- Upload endpoint
- History endpoint
- Analytics endpoint
- Dashboard endpoint

### 5. Implement AI Integration
- Setup Ollama client
- Create phi3 quick scoring service
- Create llama3 detailed feedback service (async)
- Implement OCR text extraction

### 6. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

## Phase 2: Frontend Setup (Next.js)

### 1. Initialize Next.js Project
```bash
cd client
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
npm install recharts axios jwt-decode react-dropzone lucide-react
```

### 2. Create Project Structure
- app/(auth)/login
- app/(auth)/register
- app/(dashboard)/dashboard
- app/(dashboard)/upload
- app/(dashboard)/history
- app/(dashboard)/analytics
- components/
- lib/
- types/

### 3. Implement Pages
- Authentication pages
- Dashboard with sidebar
- Upload page with drag-drop
- History table
- Analytics charts

### 4. Setup API Integration
- Create axios instance
- Implement JWT token management
- Create API service functions

## Phase 3: Integration & Testing

### 1. Start Backend
```bash
cd server
python manage.py runserver
```

### 2. Start Celery Worker
```bash
cd server
celery -A exam_evaluator worker -l info
```

### 3. Start Frontend
```bash
cd client
npm run dev
```

### 4. Verify Ollama
```bash
ollama pull phi3:mini
ollama pull llama3:8b
ollama list
```
