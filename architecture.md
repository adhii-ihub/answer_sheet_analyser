## 🏗️ EduGrade AI — Full System Architecture

---

### 🎯 Project Vision

> A self-hosted, AI-powered answer sheet correction platform for college teachers — built on Django + Next.js, running OCR and LLM entirely on-premise via Ollama. No data leaves the college network.

---

### 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        TEACHER'S BROWSER                        │
│                         (Next.js Frontend)                      │
│                                                                 │
│   Exam Setup → Upload Sheets → Live Evaluation → Review → Export│
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS / REST API
┌────────────────────────▼────────────────────────────────────────┐
│                      DJANGO BACKEND                             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │  REST API   │  │  Task Queue │  │   File Storage       │   │
│  │  (DRF)      │  │  (Celery)   │  │   (Local / S3)       │   │
│  └──────┬──────┘  └──────┬──────┘  └──────────────────────┘   │
│         │                │                                      │
│  ┌──────▼────────────────▼──────────────────────────────────┐  │
│  │                   Core Services                           │  │
│  │  parser.py │ ocr.py │ evaluator.py │ exporter.py         │  │
│  └──────────────────────────┬─────────────────────────────── ┘  │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │                    PostgreSQL DB                         │   │
│  │  Exams │ Questions │ Students │ Evaluations │ Users      │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP (internal network only)
┌────────────────────────▼────────────────────────────────────────┐
│                      OLLAMA SERVER                              │
│                    (Self-hosted, On-premise)                    │
│                                                                 │
│         LightNeonOCR 2 (VL)  │  Llama 3.2 / Mistral (LLM)     │
└─────────────────────────────────────────────────────────────────┘
```

---

### 📁 Full Project Structure

```
edugrade/
│
├── backend/                          (Django Project)
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env
│   │
│   ├── edugrade/                     (Project Config)
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── dev.py
│   │   │   └── prod.py
│   │   ├── urls.py
│   │   └── celery.py
│   │
│   ├── apps/
│   │   │
│   │   ├── exams/                    (Exam & Rubric Management)
│   │   │   ├── models.py             → Exam, Question, Criteria
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   │
│   │   ├── students/                 (Student & Sheet Management)
│   │   │   ├── models.py             → Student, AnswerSheet
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   │
│   │   ├── evaluations/              (Core Evaluation Logic)
│   │   │   ├── models.py             → Evaluation, QuestionResult
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── urls.py
│   │   │   └── tasks.py              → Celery async tasks
│   │   │
│   │   └── reports/                  (Export & Analytics)
│   │       ├── views.py
│   │       ├── generators.py         → CSV, PDF builders
│   │       └── urls.py
│   │
│   └── core/                         (Shared Services)
│       ├── parser.py                 → Rubric text → structured dict
│       ├── ocr.py                    → LightNeonOCR2 caller
│       ├── evaluator.py              → Ollama LLM caller
│       ├── exporter.py               → CSV / PDF generator
│       └── exceptions.py            → Custom error classes
│
│
└── frontend/                         (Next.js Project)
    ├── package.json
    ├── next.config.js
    ├── .env.local
    │
    ├── app/
    │   ├── layout.jsx
    │   ├── page.jsx                  → Landing / Dashboard
    │   │
    │   ├── exam/
    │   │   ├── new/
    │   │   │   └── page.jsx          → Create exam + paste rubrics
    │   │   └── [examId]/
    │   │       ├── page.jsx          → Exam overview
    │   │       ├── upload/
    │   │       │   └── page.jsx      → Batch upload answer sheets
    │   │       ├── evaluate/
    │   │       │   └── page.jsx      → Live batch evaluation board
    │   │       ├── review/
    │   │       │   └── [studentId]/
    │   │       │       └── page.jsx  → Per-student review + override
    │   │       └── report/
    │   │           └── page.jsx      → Class summary + export
    │   │
    │   └── settings/
    │       └── page.jsx              → Ollama URL, model config
    │
    ├── components/
    │   ├── exam/
    │   │   ├── RubricEditor.jsx
    │   │   ├── QuestionCard.jsx
    │   │   └── ExamHeader.jsx
    │   ├── evaluation/
    │   │   ├── BatchProgressBoard.jsx
    │   │   ├── StudentRow.jsx
    │   │   ├── OcrViewer.jsx
    │   │   ├── MarkOverride.jsx
    │   │   └── ConfidenceFlag.jsx
    │   ├── reports/
    │   │   ├── MarkSheet.jsx
    │   │   ├── ScoreChart.jsx
    │   │   └── ExportButtons.jsx
    │   └── ui/
    │       ├── ScoreRing.jsx
    │       ├── ProgressBar.jsx
    │       ├── Badge.jsx
    │       └── FileDropZone.jsx
    │
    ├── lib/
    │   ├── api.js                    → Axios instance + all API calls
    │   └── utils.js                  → Grade calculator, formatters
    │
    └── store/
        └── examStore.js              → Zustand global state
```

---

### 🗄️ Database Schema

```
┌──────────────────────────────────────────────────────────────┐
│  exams_exam                                                  │
│  id │ title │ subject │ date │ total_marks │ created_by      │
│  created_at │ status (draft/active/closed)                   │
└────────────────────────┬─────────────────────────────────────┘
                         │ 1:many
┌────────────────────────▼─────────────────────────────────────┐
│  exams_question                                              │
│  id │ exam_id │ q_number │ description │ max_marks          │
└────────────────────────┬─────────────────────────────────────┘
                         │ 1:many
┌────────────────────────▼─────────────────────────────────────┐
│  exams_criteria                                              │
│  id │ question_id │ text │ marks                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  students_student                                            │
│  id │ exam_id │ name │ roll_no │ sheet_image │ ocr_output   │
│  ocr_status (pending/running/done/failed)                    │
└────────────────────────┬─────────────────────────────────────┘
                         │ 1:1
┌────────────────────────▼─────────────────────────────────────┐
│  evaluations_evaluation                                      │
│  id │ student_id │ total_marks │ percentage │ grade         │
│  status (pending/running/done) │ finalized                  │
└────────────────────────┬─────────────────────────────────────┘
                         │ 1:many
┌────────────────────────▼─────────────────────────────────────┐
│  evaluations_questionresult                                  │
│  id │ evaluation_id │ question_id │ ai_marks                 │
│  teacher_marks │ final_marks │ justification                 │
│  key_points │ missing_points │ confidence │ is_overridden    │
└──────────────────────────────────────────────────────────────┘
```

---

### 🔌 Full API Endpoint Map

```
── EXAM MANAGEMENT ──────────────────────────────────────────
POST   /api/exams/                    Create new exam
GET    /api/exams/                    List all exams
GET    /api/exams/:id/                Get exam detail
PATCH  /api/exams/:id/                Update exam
DELETE /api/exams/:id/                Delete exam
POST   /api/exams/:id/parse-rubrics/  Parse raw rubric text → questions

── STUDENT MANAGEMENT ───────────────────────────────────────
POST   /api/exams/:id/students/       Add single student + upload sheet
POST   /api/exams/:id/students/batch/ Upload multiple sheets at once
GET    /api/exams/:id/students/       List all students for exam
GET    /api/students/:id/             Get student detail + OCR output
DELETE /api/students/:id/             Remove student

── EVALUATION ───────────────────────────────────────────────
POST   /api/students/:id/ocr/         Run OCR on student's sheet
POST   /api/students/:id/evaluate/    Run LLM evaluation (after OCR)
POST   /api/students/:id/pipeline/    Run OCR + evaluate in one call
POST   /api/exams/:id/evaluate-all/   Queue batch evaluation (Celery)
GET    /api/exams/:id/progress/       Get batch progress (polling)

── OVERRIDE & FINALIZE ──────────────────────────────────────
PATCH  /api/results/:id/override/     Teacher overrides a question mark
POST   /api/evaluations/:id/finalize/ Lock evaluation as final

── REPORTS ──────────────────────────────────────────────────
GET    /api/exams/:id/report/         Class summary JSON
GET    /api/exams/:id/export/csv/     Download mark sheet CSV
GET    /api/exams/:id/export/pdf/     Download mark sheet PDF
GET    /api/exams/:id/analytics/      Per-question averages, flags
```

---

### ⚙️ Core Service Logic

```
parser.py
─────────
Input:  Raw rubric text (string)
Output: { "q1": { max_marks, description, criteria[] }, ... }
How:    Regex patterns extract Q numbers, marks, criteria lines
Used by: exam creation + OCR prompt builder

ocr.py
──────
Input:  Image path + list of question IDs
Output: { "q1": "student answer text", "q2": "..." }
How:    Base64 encode image → POST to Ollama VL (lightneonocr2)
        Prompt includes question IDs from parser output
        Parse JSON from model response
Used by: /ocr/ endpoint + pipeline

evaluator.py
────────────
Input:  OCR output dict + parsed rubric dict
Output: { "q1": { awarded_marks, justification, key_points,
                  missing_points, confidence }, ... }
How:    For each question → build prompt with criteria + answer
        POST to Ollama LLM → parse JSON response
        Validate marks don't exceed max_marks
Used by: /evaluate/ endpoint + pipeline

exporter.py
───────────
Input:  Exam ID (fetches from DB)
Output: CSV file or PDF file
How:    CSV via csv module, PDF via reportlab or weasyprint
Used by: /export/ endpoints
```

---

### 🔄 Async Batch Flow (Celery)

```
Teacher clicks "Evaluate All 60 Students"
        ↓
Django creates one Celery task per student
        ↓
Redis queue holds all tasks
        ↓
Celery workers process tasks (2-4 workers)
  Each worker: OCR → LLM per question → save to DB
        ↓
Frontend polls GET /api/exams/:id/progress/ every 3s
  Returns: { total: 60, ocr_done: 45, evaluated: 30, failed: 2 }
        ↓
Teacher sees live progress board updating
        ↓
Completed students become reviewable immediately
```

---

### 🖥️ Frontend Page Flow

```
Dashboard (list of exams)
    ↓
Create Exam (title + paste rubrics → auto-parse questions)
    ↓
Exam Overview (question list, total marks, status)
    ↓
Upload Page (drag & drop multiple answer sheet images)
    ↓
Evaluation Board (live batch progress, per-student status)
    ↓
Student Review (OCR text, AI marks, justification, override inputs)
    ↓
Report Page (class table, charts, export CSV/PDF)
```

---

### 🛠️ Tech Stack (Final)

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | File-based routing, server components |
| Styling | Tailwind CSS | Rapid utility styling |
| State | Zustand | Lightweight, no boilerplate |
| Backend | Django 5 + DRF | Clean ORM, fast API setup |
| Task Queue | Celery + Redis | Async batch processing |
| Database | PostgreSQL | Relational, reliable |
| OCR | LightNeonOCR 2 via Ollama VL | On-premise, your existing setup |
| LLM | Llama 3.2 via Ollama | On-premise, no API cost |
| File Storage | Local (Phase 1) → S3 (Phase 2+) | Simple to start, scalable |
| Export | ReportLab (PDF) + csv module | No external dependencies |

---

### 🚀 Build Phases

```
Phase 1 — Core Pipeline (NOW)
  parser.py + ocr.py + evaluator.py
  Single /pipeline/ endpoint
  Simple Next.js upload → result UI
  No database, no auth, no batch
  Goal: Prove OCR → LLM → marks works end to end

Phase 2 — Persistence
  PostgreSQL models
  All REST endpoints
  Save exams, students, results to DB
  Basic exam management UI

Phase 3 — Batch Processing
  Celery + Redis setup
  Batch upload + evaluate-all
  Live progress polling
  Batch progress board in UI

Phase 4 — Review & Export
  Per-student review + override UI
  Mark finalization
  CSV + PDF export
  Basic analytics

Phase 5 — Production Polish
  Teacher auth (Django auth or JWT)
  S3 file storage
  Docker + docker-compose
  Nginx + Gunicorn deployment
  Error handling + logging
```

---

### ✅ Shall We Begin?

Phase 1 build order:

1. `parser.py` — pure Python, zero dependencies, testable immediately
2. `ocr.py` — connect to your Ollama VL endpoint
3. `evaluator.py` — connect to your Ollama LLM
4. `views.py` — wire them into `/api/pipeline/`
5. Next.js upload page → result page

**Say the word and we start with `parser.py`.**