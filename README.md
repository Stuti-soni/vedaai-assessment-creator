# VedaAI — AI Assessment Creator

An AI-powered question paper generator for teachers. Upload a reference document, specify the question breakdown, and get a complete formatted exam paper in seconds.

---

## Features

- **AI Question Generation** — Generates structured question papers via Groq (Llama 3.3 70B), optionally grounded in uploaded reference material
- **PDF Upload & Extraction** — Upload a PDF or image; text is extracted and passed to the AI for context-aware questions
- **Real-time Progress** — Generation steps are streamed live via WebSocket, with a polling fallback for reliability
- **Answer Key Toggle** — Teachers can reveal model answers inline without printing a separate document
- **Assignment Management** — Search, filter by status, and delete assignments from the dashboard
- **Subject Color Coding** — Cards are colour-tagged by subject for quick scanning
- **Due Date Warnings** — Overdue and soon-due assignments are flagged automatically
- **Voice Input** — Additional instructions can be dictated using the Web Speech API
- **PDF Export** — Download the generated paper as a formatted PDF

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS v4 |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Backend | Node.js, Express 5, TypeScript |
| AI | Groq API (`llama-3.3-70b-versatile`) via OpenAI-compatible SDK |
| Queue | BullMQ + Redis |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO |
| File Handling | multer (memory storage) + pdf-parse v2 |

---

## Prerequisites

- Node.js 18+
- MongoDB running on `localhost:27017`
- Redis running on `localhost:6379`
- A free [Groq API key](https://console.groq.com)

---

## Setup

### 1. Clone and install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

Create `backend/.env`:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=your_groq_api_key_here
FRONTEND_URL=http://localhost:3000
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How It Works

```
Teacher fills form → POST /api/assignments (multipart)
       ↓
Backend extracts PDF text (pdf-parse) → stores assignment in MongoDB
       ↓
BullMQ enqueues generation job → worker picks it up
       ↓
Worker calls Groq API with prompt + extracted text
       ↓
Each step emits WebSocket event → frontend ticks progress steps live
       ↓
Completed paper saved to MongoDB → redirect to output page
```

### Generation Steps

1. Request received
2. Extracting document content
3. Analysing requirements
4. Generating questions
5. Formatting paper

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Mongoose schemas (Assignment, GeneratedPaper)
│   │   ├── queues/          # BullMQ queue setup
│   │   ├── routes/          # Express routes
│   │   ├── services/        # AI, assignment, file, prompt logic
│   │   ├── websocket/       # Socket.IO server
│   │   └── workers/         # Generation worker
│   └── .env
│
└── frontend/
    ├── app/
    │   ├── page.tsx                       # Dashboard
    │   ├── assignments/new/page.tsx       # Create form
    │   ├── assignments/[id]/page.tsx      # Output view
    │   └── assignments/[id]/generating/  # Live progress page
    ├── components/
    │   ├── create/      # UploadBox, QuestionTypeRow, VoiceInput
    │   ├── dashboard/   # AssignmentCard, EmptyState
    │   ├── generating/  # ProgressSteps
    │   ├── layout/      # Sidebar, BottomNav
    │   ├── output/      # ExamPaper, QuestionSection, PDFExport
    │   └── ui/          # Toast
    ├── services/        # API client, Socket.IO client
    ├── store/           # Zustand stores
    └── types/           # TypeScript interfaces
```

---

## Key Design Decisions

**BullMQ connection** — BullMQ bundles its own ioredis internally. Passing a node-redis client causes a `defineCommand is not a function` error. The worker uses a plain `{ host, port }` connection object to avoid this.

**Progress replay** — `currentStep` is persisted in MongoDB so that if the frontend connects after the worker has already progressed, it can replay completed steps rather than showing a stale spinner.

**Answer key** — Answers are generated in the same AI call and stored in MongoDB but hidden by default. The teacher toggles visibility client-side — no extra round trip needed.

**Groq as AI provider** — Groq's free tier is used with the `llama-3.3-70b-versatile` model via the OpenAI-compatible API, making it easy to swap providers by changing two environment variables.
