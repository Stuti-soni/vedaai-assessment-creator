# VedaAI Assessment Creator — Design Spec

**Date:** 2026-05-26  
**Stack:** Next.js 14 + Express + MongoDB + Redis + BullMQ + Socket.IO + Grok API  
**Deployment:** Vercel (frontend) + Railway (backend + MongoDB + Redis)

---

## Overview

A teacher-facing web app that lets users create assignments, trigger AI-powered question paper generation via a background job queue, and view/download the structured output as a professional exam paper.

---

## Architecture

**Monorepo** with two top-level directories: `frontend/` and `backend/`.

### Frontend (Vercel)
- Next.js 14 App Router + TypeScript + Tailwind CSS
- Zustand for client state
- React Hook Form + Zod for form validation
- Axios for REST calls
- Socket.IO client for real-time updates
- `@react-pdf/renderer` for PDF export

### Backend (Railway)
- Express + TypeScript
- MongoDB (assignments + generated papers)
- Redis (BullMQ job store + status cache)
- BullMQ (background generation worker)
- Socket.IO server (real-time job completion events)
- Grok API (xAI, OpenAI-compatible) for question generation

---

## Frontend Routes

| Route | Description |
|-------|-------------|
| `/` | Dashboard — empty state or assignment card list |
| `/assignments/new` | Multi-field create assignment form |
| `/assignments/[id]/generating` | Step-by-step progress screen (WebSocket) |
| `/assignments/[id]` | Generated exam paper output + PDF export |

---

## Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assignments` | Create assignment, enqueue BullMQ job, return `assignmentId` |
| GET | `/api/assignments` | List all assignments (title, status, dueDate) |
| GET | `/api/assignments/:id` | Get assignment + generated paper if completed |
| POST | `/api/assignments/:id/regenerate` | Re-enqueue generation job for existing assignment |

---

## Folder Structure

### frontend/src/
```
app/
  page.tsx                          ← Dashboard
  assignments/
    new/page.tsx                    ← Create form
    [id]/page.tsx                   ← Output paper
    [id]/generating/page.tsx        ← Progress screen
components/
  layout/
    Sidebar.tsx                     ← Desktop nav
    BottomNav.tsx                   ← Mobile nav
  dashboard/
    AssignmentCard.tsx
    EmptyState.tsx
  create/
    QuestionTypeRow.tsx             ← Dynamic question type row
    UploadBox.tsx                   ← File upload UI (no parsing)
  output/
    ExamPaper.tsx                   ← Full paper layout
    QuestionSection.tsx
    DifficultyBadge.tsx
    PDFExport.tsx                   ← @react-pdf/renderer
  generating/
    ProgressSteps.tsx               ← Step-by-step progress
store/
  assignmentStore.ts                ← Assignment list + selected
  generationStore.ts                ← Generation status + steps
services/
  api.ts                            ← Axios client
  socket.ts                         ← Socket.IO client singleton
types/
  assignment.ts
  paper.ts
lib/
  validators.ts                     ← Zod schemas (shared with forms)
```

### backend/src/
```
controllers/
  assignment.controller.ts
routes/
  assignment.routes.ts
services/
  assignment.service.ts
  ai.service.ts                     ← Grok API calls
  prompt.service.ts                 ← Prompt construction
workers/
  generation.worker.ts              ← BullMQ processor
queues/
  generation.queue.ts               ← Queue definition
websocket/
  socket.server.ts                  ← Socket.IO server + room logic
models/
  Assignment.model.ts
  GeneratedPaper.model.ts
lib/
  db.ts                             ← MongoDB connection
  redis.ts                          ← Redis client
  validators.ts                     ← Zod schemas for AI output
utils/
  logger.ts
app.ts
server.ts
```

---

## Data Models

### Assignment (MongoDB)
```typescript
{
  _id: ObjectId,
  title: string,
  subject: string,
  dueDate: Date,
  additionalInfo: string,
  questionTypes: Array<{
    type: string,       // e.g. "Multiple Choice Questions"
    count: number,
    marks: number
  }>,
  totalQuestions: number,
  totalMarks: number,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  generatedPaperId: ObjectId | null,
  createdAt: Date
}
```

### GeneratedPaper (MongoDB)
```typescript
{
  _id: ObjectId,
  assignmentId: ObjectId,
  schoolName: string,
  subject: string,
  class: string,
  duration: string,
  totalMarks: number,
  sections: Array<{
    title: string,           // "Section A", "Section B", etc.
    instruction: string,
    questions: Array<{
      text: string,
      difficulty: 'easy' | 'medium' | 'hard',
      marks: number,
      type: string
    }>
  }>,
  createdAt: Date
}
```

---

## WebSocket Flow

1. Frontend submits form → `POST /api/assignments` → receives `assignmentId`
2. Frontend navigates to `/assignments/[id]/generating`
3. Socket.IO client joins room: `socket.emit('join-room', assignmentId)`
4. Backend worker processes job, emits `assignment-completed` or `assignment-failed` to room
5. Frontend receives event → navigates to `/assignments/[id]`

### Progress Steps (shown on generating page)
1. Creating job
2. Processing request
3. Generating questions
4. Structuring paper
5. Finalizing

Steps 1-2 are immediate. Steps 3-5 are emitted by the worker via socket events.

---

## AI Generation

### Prompt Strategy
`prompt.service.ts` builds a structured prompt from the assignment fields:
- Subject, question types, counts, marks, additional instructions
- Instructs Grok to return **only valid JSON** matching the `GeneratedPaper` schema
- Uses `response_format: { type: "json_object" }` (OpenAI-compatible)

### Validation
- Zod schema validates the parsed JSON before saving to MongoDB
- On validation failure: job marked `failed`, `assignment-failed` emitted to frontend

### Error Recovery
- Frontend on `assignment-failed`: shows error state with "Try Again" button (triggers regenerate endpoint)

---

## Form Validation Rules

- Title: auto-generated as `"{subject} Assignment"` — not a separate form field
- Subject: required, non-empty
- Due date: required, must be future date
- Question types: at least one row required
- Count per type: integer, min 1
- Marks per type: integer, min 1
- Total questions and total marks auto-calculated, displayed live

---

## PDF Export

- `PDFExport.tsx` uses `@react-pdf/renderer` to render the `GeneratedPaper` data as a downloadable PDF
- Triggered by "Download as PDF" button on the output page
- Renders: school name, subject, class, duration, total marks, sections, questions, difficulty tags, answer key section

---

## Improvements Over Original Plan

1. **`prompt.service.ts` separated from `ai.service.ts`** — prompt logic is independently testable and swappable without touching the HTTP client
2. **Regenerate endpoint** — supports re-running generation without creating a new assignment
3. **`assignment-failed` WebSocket event** — explicit failure path with user-facing recovery
4. **Progress step events from worker** — not just a spinner; worker emits intermediate steps so the frontend can show real progress
5. **`response_format: json_object`** on Grok call — forces JSON output, reduces parse failures
6. **File upload is UI-only** — stored reference, not parsed; keeps scope clean
7. **Redis caches assignment status** — `GET /api/assignments` reads status from Redis cache first, reducing MongoDB reads on the list view

---

## Environment Variables

### frontend/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### backend/.env
```
PORT=4000
MONGODB_URI=mongodb://...
REDIS_URL=redis://...
GROK_API_KEY=xai-...
GROK_BASE_URL=https://api.x.ai/v1
GROK_MODEL=grok-3
FRONTEND_URL=http://localhost:3000
```
