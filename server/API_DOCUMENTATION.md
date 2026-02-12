# Backend API Documentation

## Overview

The AI Exam Evaluation Platform backend is built with Django REST Framework and provides a comprehensive API for exam evaluation using local AI models.

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│     Django REST API             │
│  ┌──────────────────────────┐  │
│  │  Authentication (JWT)    │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  File Upload Handler     │  │
│  └──────────────────────────┘  │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Celery Task Queue           │
│  ┌──────────────────────────┐  │
│  │  OCR Processing          │  │
│  │  (pytesseract, PyPDF2)   │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  AI Evaluation           │  │
│  │  - phi3:mini (quick)     │  │
│  │  - llama3:8b (detailed)  │  │
│  └──────────────────────────┘  │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│     Database (SQLite)           │
│  - Users                        │
│  - Submissions                  │
│  - Evaluations                  │
│  - Analytics Cache              │
└─────────────────────────────────┘
```

## AI Evaluation Pipeline

### Stage 1: File Upload
- User uploads 3 files (question, answer, rubric)
- Files validated for size and format
- Submission record created with status: `uploading`

### Stage 2: OCR Processing (Async)
- Celery task: `process_submission_files`
- Extract text from PDFs using PyPDF2
- Fallback to OCR (pytesseract) for images or scanned PDFs
- Status updated to: `processing`

### Stage 3: Quick Evaluation (Sync)
- Celery task: `quick_evaluate_submission`
- Uses phi3:mini model via Ollama
- Returns: `{"score": float, "quick_feedback": string}`
- Processing time: ~2-3 seconds
- Status updated to: `quick_done`

### Stage 4: Detailed Evaluation (Async)
- Celery task: `detailed_evaluate_submission`
- Uses llama3:8b model via Ollama
- Returns comprehensive feedback JSON
- Processing time: ~10-30 seconds
- Status updated to: `complete`

## API Endpoints Reference

### Authentication Endpoints

#### POST /api/auth/register/
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "password2": "string"
}
```

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "tokens": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

#### POST /api/auth/login/
Authenticate and receive JWT tokens.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "tokens": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

#### GET /api/auth/profile/
Get authenticated user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Submission Endpoints

#### POST /api/upload/
Upload exam files for evaluation.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `question_file`: File (PDF or image)
- `answer_file`: File (PDF or image)
- `rubric_file`: File (PDF or image)

**Response (201):**
```json
{
  "id": 1,
  "question_file": "/media/questions/question_abc123.pdf",
  "answer_file": "/media/answers/answer_abc123.pdf",
  "rubric_file": "/media/rubrics/rubric_abc123.pdf",
  "status": "uploading",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "evaluation": null
}
```

#### GET /api/history/
Get list of all submissions.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "status": "complete",
    "quick_score": 75.0,
    "final_score": 78.5,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:35:00Z"
  }
]
```

#### GET /api/submissions/{id}/
Get detailed submission information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": 1,
  "question_file": "/media/questions/question_abc123.pdf",
  "answer_file": "/media/answers/answer_abc123.pdf",
  "rubric_file": "/media/rubrics/rubric_abc123.pdf",
  "status": "complete",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:35:00Z",
  "evaluation": {
    "id": 1,
    "quick_score": 75.0,
    "quick_feedback": "Good understanding of core concepts...",
    "final_score": 78.5,
    "strengths": [
      "Clear explanation of main concepts",
      "Good use of examples"
    ],
    "mistakes": [
      "Missing diagram labels",
      "Incomplete conclusion"
    ],
    "improvement_suggestions": [
      "Add more detailed diagrams",
      "Expand on the conclusion"
    ],
    "detailed_feedback": "The answer demonstrates...",
    "created_at": "2024-01-15T10:32:00Z",
    "updated_at": "2024-01-15T10:35:00Z"
  }
}
```

### Analytics Endpoints

#### GET /api/dashboard/
Get dashboard summary.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "total_uploads": 15,
  "average_score": 78.5,
  "recent_submissions": [
    {
      "id": 5,
      "status": "complete",
      "quick_score": 75.0,
      "final_score": 78.0,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:35:00Z"
    }
  ],
  "pending_evaluations": 2
}
```

#### GET /api/analytics/
Get comprehensive analytics.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "total_submissions": 15,
  "average_quick_score": 75.5,
  "average_final_score": 78.2,
  "score_timeline": [
    {
      "date": "2024-01-15",
      "quick_score": 75.0,
      "final_score": 78.0
    }
  ],
  "performance_distribution": {
    "0-20": 0,
    "21-40": 1,
    "41-60": 3,
    "61-80": 7,
    "81-100": 4
  },
  "strengths_vs_weaknesses": {
    "strengths": 45,
    "weaknesses": 23
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "field_name": ["Error message"]
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Submission Status Flow

```
uploading → processing → quick_done → complete
                              ↓
                           failed
```

- **uploading**: Files uploaded, awaiting processing
- **processing**: OCR extraction in progress
- **quick_done**: Quick evaluation complete, detailed evaluation in progress
- **complete**: All evaluations complete
- **failed**: Error occurred during processing

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Token Lifecycle

1. **Register/Login** → Receive `access` and `refresh` tokens
2. **Use Access Token** → Include in `Authorization: Bearer <token>` header
3. **Token Expires** → Use refresh token to get new access token
4. **Refresh Token** → POST to `/api/auth/token/refresh/`

### Token Expiry

- **Access Token**: 24 hours
- **Refresh Token**: 7 days

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding:
- Django REST Framework throttling
- Redis-based rate limiting
- Per-user quotas

## File Upload Constraints

- **Max file size**: 10MB per file
- **Allowed formats**: PDF, PNG, JPG, JPEG
- **Required files**: All 3 files (question, answer, rubric) must be provided

## AI Model Configuration

### phi3:mini (Quick Evaluation)
- **Purpose**: Fast initial scoring
- **Response time**: 2-3 seconds
- **Output**: Score (0-100) + brief feedback
- **Execution**: Synchronous

### llama3:8b (Detailed Evaluation)
- **Purpose**: Comprehensive analysis
- **Response time**: 10-30 seconds
- **Output**: Detailed JSON with strengths, mistakes, suggestions
- **Execution**: Asynchronous (Celery task)

## Database Schema

### User Model
```python
- id: AutoField
- username: CharField (unique)
- email: EmailField (unique)
- password: CharField (hashed)
- created_at: DateTimeField
- updated_at: DateTimeField
```

### Submission Model
```python
- id: AutoField
- user: ForeignKey(User)
- question_file: FileField
- answer_file: FileField
- rubric_file: FileField
- question_text: TextField
- answer_text: TextField
- rubric_text: TextField
- status: CharField (choices)
- created_at: DateTimeField
- updated_at: DateTimeField
```

### Evaluation Model
```python
- id: AutoField
- submission: OneToOneField(Submission)
- quick_score: FloatField
- quick_feedback: TextField
- final_score: FloatField
- feedback_json: JSONField
- created_at: DateTimeField
- updated_at: DateTimeField
```

## Testing

### Using Swagger UI
1. Navigate to http://localhost:8000/
2. Click "Authorize" button
3. Enter JWT token: `Bearer <your_access_token>`
4. Test endpoints interactively

### Using Postman
1. Import `API_Collection.postman_collection.json`
2. Run "Register User" or "Login" request
3. Token automatically saved to collection variables
4. Test other endpoints

### Using cURL
See README.md for cURL examples

## Deployment Considerations

### Production Checklist

- [ ] Set `DEBUG = False`
- [ ] Use PostgreSQL instead of SQLite
- [ ] Configure proper `SECRET_KEY`
- [ ] Setup HTTPS/SSL
- [ ] Use production WSGI server (Gunicorn, uWSGI)
- [ ] Configure static file serving (Nginx, WhiteNoise)
- [ ] Setup proper logging
- [ ] Configure Celery with production broker (RabbitMQ)
- [ ] Implement rate limiting
- [ ] Add monitoring (Sentry, New Relic)
- [ ] Setup backups
- [ ] Configure CORS properly
- [ ] Use environment variables for sensitive data

## Support

For issues, questions, or contributions, please refer to the main README.md file.
