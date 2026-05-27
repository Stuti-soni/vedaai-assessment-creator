# VedaAI — AI Assessment Creator

An AI-powered question paper generator for teachers. Upload a reference document or image, specify the question breakdown, and get a complete formatted exam paper in seconds.

**Live Demo:** [https://vedaai-assessment-creator-rhk7.vercel.app](https://vedaai-assessment-creator-rhk7.vercel.app)


## Features

- **AI Question Generation** — Generates structured question papers via Groq (Llama 3.3 70B), grounded in uploaded reference material
- **Image Understanding** — Upload a diagram or image; Groq's vision model (Llama 4 Scout) reads and describes it to generate relevant questions
- **PDF Text Extraction** — Upload a PDF; text is extracted via pdf-parse and passed to the AI as context
- **Real-time Progress** — Generation steps stream live via WebSocket, with a polling fallback for reliability
- **Answer Key Toggle** — Teachers reveal model answers inline — no separate document needed
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
| Forms | React Hook Form + Zod v3 |
| Backend | Node.js, Express 5, TypeScript |
| AI (text) | Groq `llama-3.3-70b-versatile` |
| AI (vision) | Groq `meta-llama/llama-4-scout-17b-16e-instruct` |
| Queue | BullMQ + Redis |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO |
| File Handling | multer (memory storage) + pdf-parse v2 |
| Deployment | Vercel (frontend) + Render (backend) |

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
Teacher fills form + uploads file → POST /api/assignments (multipart)
              ↓
   PDF? → pdf-parse extracts text
   Image? → Groq vision model describes the image
              ↓
   BullMQ enqueues generation job → worker picks it up
              ↓
   Worker calls Groq API with prompt + extracted content
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
│   └── .env.example
│
└── frontend/
    ├── app/
    │   ├── page.tsx                       # Dashboard
    │   ├── assignments/new/page.tsx       # Create assignment form
    │   ├── assignments/[id]/page.tsx      # Output view with answer key toggle
    │   └── assignments/[id]/generating/  # Live progress page
    ├── components/
    │   ├── create/      # UploadBox, QuestionTypeRow, VoiceInput
    │   ├── dashboard/   # AssignmentCard, EmptyState
    │   ├── generating/  # ProgressSteps
    │   ├── layout/      # Sidebar, BottomNav
    │   ├── output/      # ExamPaper, QuestionSection, PDFExport
    │   └── ui/          # Toast notifications
    ├── services/        # API client, Socket.IO client
    ├── store/           # Zustand stores (assignments, generation, toasts)
    └── types/           # TypeScript interfaces
```

---

## Key Design Decisions

**Vision AI for images** — When a teacher uploads an image (diagram, textbook page), the Groq vision model first describes what it sees in detail. That description is then passed to the text model as reference material, producing questions actually grounded in the image content.

**BullMQ connection** — BullMQ bundles its own ioredis internally. Passing a node-redis client causes a `defineCommand is not a function` error. The worker uses a plain `{ host, port }` connection object to avoid this conflict.

**Progress replay** — `currentStep` is persisted in MongoDB so if the frontend connects after the worker has already progressed, it replays completed steps rather than showing a stale spinner.

**Answer key** — Answers are generated in the same AI call and stored in MongoDB but hidden by default. The teacher toggles visibility client-side — no extra API round trip needed.

**Groq as AI provider** — Groq's free tier supports both a powerful text model and a vision model, making the full feature set achievable at zero cost.
