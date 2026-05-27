# VedaAI — AI Assessment Creator

An AI-powered question paper generator for teachers. Upload a reference document or image, specify the question breakdown, and get a complete formatted exam paper in seconds — no manual question writing needed.

**Live Demo:** [https://vedaai-assessment-creator-rhk7.vercel.app](https://vedaai-assessment-creator-rhk7.vercel.app)

> **Note:** The backend is hosted on Render's free tier and may take 30–60 seconds to wake up on the first request. Subsequent requests are fast.

---

## Assignment Requirements Coverage

| Requirement | How It's Met |
|---|---|
| File upload (PDF / image) | multer accepts PDF + images up to 25MB; pdf-parse extracts PDF text; Groq vision model describes images |
| Due date, question types, marks, instructions | All fields in the create form with Zod validation (no empty/negative values) |
| Proper validation | React Hook Form + Zod schema on frontend; Zod validates AI response on backend before saving |
| Zustand for state management | `assignmentStore`, `generationStore`, `toastStore` — all Zustand |
| WebSocket management | Socket.IO with per-assignment rooms; connect/disconnect lifecycle managed in generating page; polling fallback if socket event missed |
| Structured prompt → AI generation | `prompt.service.ts` builds a structured prompt; AI returns sections (A, B…), questions, difficulty, marks |
| Do not render raw LLM response | AI JSON is validated via Zod, mapped to typed interfaces, and rendered as a structured exam paper component |
| MongoDB | Stores assignments + generated papers (sections, questions, answers) |
| Redis | Caches assignment list; invalidated on create/delete |
| BullMQ | Background job queue for generation; worker runs 5 steps with progress tracking |
| WebSocket real-time updates | Each worker step emits a Socket.IO event; `currentStep` also saved to DB for replay on reconnect |
| Output page — student info section | Name, Roll Number, Class input lines rendered in `ExamPaper.tsx` |
| Output page — sections with title + instruction + questions | Each section has title, instruction, and numbered questions list |
| Each question — text + difficulty + marks | Rendered in `QuestionSection.tsx` |
| PDF export | `@react-pdf/renderer` — proper formatted PDF, not raw HTML print |
| Regenerate action | Regenerate button re-enqueues the generation job |
| Difficulty badges | Easy (green) / Medium (yellow) / Hard (red) badges per question |
| **Bonus** — Answer key toggle | Answers generated in same AI call, hidden by default, toggled by teacher |
| **Bonus** — Voice input | Web Speech API mic button on additional instructions field |
| **Bonus** — Subject colour coding | Cards colour-tagged by subject on dashboard |
| **Bonus** — Due date warnings | Overdue / due today / due soon badges on assignment cards |

---

## What It Does

Teachers often spend hours writing question papers. VedaAI automates this — a teacher uploads a textbook page, diagram, or PDF, selects how many questions of each type they want (MCQ, short answer, long answer etc.), and the AI generates a fully formatted, print-ready question paper with an optional answer key.

The generation happens asynchronously in a background queue so the teacher can see live progress as each step completes — extracting content, analysing requirements, generating questions, formatting the paper.

---

## Features

- **AI Question Generation** — Generates structured question papers via Groq (Llama 3.3 70B), grounded in uploaded reference material
- **Image Understanding** — Upload a diagram or image; Groq's vision model (Llama 4 Scout) reads and describes it to generate context-aware questions rather than generic ones
- **PDF Text Extraction** — Upload a PDF; text is extracted via pdf-parse and passed to the AI as context
- **Real-time Progress** — Generation steps stream live via WebSocket, with a polling fallback in case the WebSocket event is missed
- **Answer Key Toggle** — Teachers reveal model answers inline — generated in the same AI call, stored in DB, hidden by default
- **Assignment Management** — Search by title, filter by status (pending/processing/completed/failed), delete assignments
- **Subject Color Coding** — Cards are colour-tagged by subject for quick visual scanning
- **Due Date Warnings** — Overdue and soon-due assignments are automatically flagged with colour badges
- **Voice Input** — Additional instructions can be dictated via the Web Speech API
- **PDF Export** — Download the generated paper as a formatted PDF using `@react-pdf/renderer`
- **Toast Notifications** — Success and error feedback for all actions

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS v4 | Server components, file-based routing, type safety |
| State | Zustand | Lightweight, no boilerplate, works well with async |
| Forms | React Hook Form + Zod v3 | Performant validation, schema-driven types |
| Backend | Node.js, Express 5, TypeScript | Familiar, fast to build, good ecosystem |
| AI (text) | Groq `llama-3.3-70b-versatile` | Free tier, OpenAI-compatible API, fast inference |
| AI (vision) | Groq `meta-llama/llama-4-scout-17b-16e-instruct` | Free vision model, understands diagrams and images |
| Queue | BullMQ + Redis | Reliable background job processing, retries, progress tracking |
| Database | MongoDB + Mongoose | Flexible schema for evolving question paper structure |
| Real-time | Socket.IO | Bi-directional events for live progress updates |
| File Handling | multer (memory storage) + pdf-parse v2 | In-memory processing, no disk I/O needed |
| Deployment | Vercel (frontend) + Render (backend) | Free tier, auto-deploy on push |

---

## Sample Test Files

Use the files below to test the app immediately — no need to find your own content.

### Science — Soil Layers Diagram (Image)

🖼️ [Download soil layers diagram](https://drive.google.com/file/d/1FRiMPwxzm937RYVopNgnS_j_r71KaekV/view?usp=sharing)

Upload this to test the **vision AI** feature. The model will read the diagram and generate questions about humus, topsoil, subsoil, parent rock, and bedrock.

> Suggested: Subject `Science` → 5 Fill in the Blanks (2 marks each)

### English — Grade 4 Textbook Chapter (PDF)

📄 [Download sample English chapter PDF](https://drive.google.com/file/d/1eXfT0NpHFL-HO1UBV53H7_qqF2DCqT9P/view?usp=sharing)

Upload this to test **PDF text extraction**. The AI will extract the chapter text and generate comprehension and grammar questions based on the actual content.

> Suggested: Subject `English` → 3 Short Answer (3 marks each) + 2 Long Answer (5 marks each)

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
git clone https://github.com/Stuti-soni/vedaai-assessment-creator.git
cd vedaai-assessment-creator

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure environment

Create `backend/.env` (refer to `backend/.env.example` for all required keys):

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=your_groq_api_key_here
FRONTEND_URL=http://localhost:3000
```

### 3. Start MongoDB and Redis

```bash
# Using Docker
docker run -d -p 27017:27017 mongo:7
docker run -d -p 6379:6379 redis:7
```

### 4. Run

```bash
# Terminal 1 — Backend (runs server + BullMQ worker)
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/assignments` | List all assignments (Redis cached) |
| `POST` | `/api/assignments` | Create assignment + enqueue generation job (multipart/form-data) |
| `GET` | `/api/assignments/:id` | Get assignment + generated paper |
| `POST` | `/api/assignments/:id/regenerate` | Re-enqueue generation for an assignment |
| `DELETE` | `/api/assignments/:id` | Delete assignment + generated paper + invalidate cache |
| `GET` | `/health` | Health check |

The `POST /api/assignments` endpoint accepts `multipart/form-data` with:
- `subject` — string
- `dueDate` — ISO date string
- `questionTypes` — JSON stringified array of `{ type, count, marks }`
- `additionalInfo` — optional string
- `file` — optional PDF or image file (max 25MB)

---

## How It Works

```
Teacher fills form + uploads file → POST /api/assignments (multipart/form-data)
                ↓
     PDF? → pdf-parse extracts raw text
     Image? → Groq vision model (Llama 4 Scout) describes the image in detail
                ↓
     Assignment saved to MongoDB with status "pending"
     BullMQ enqueues a generation job
                ↓
     Frontend navigates to /assignments/:id/generating
     Socket.IO joins a room for this assignment ID
                ↓
     Worker picks up the job and runs 5 steps:
       Step 1 — Request received
       Step 2 — Extracting document content
       Step 3 — Analysing requirements
       Step 4 — Generating questions (Groq API call)
       Step 5 — Formatting and saving paper
                ↓
     Each step: emits WebSocket event + saves currentStep to MongoDB
     (currentStep in DB allows progress replay if frontend reconnects late)
                ↓
     On completion: assignment status → "completed", redirect to output page
```

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── assignment.controller.ts   # Handles all HTTP requests
│   │   ├── models/
│   │   │   ├── Assignment.model.ts        # Assignment schema (status, questionTypes, currentStep)
│   │   │   └── GeneratedPaper.model.ts    # Paper schema (sections, questions, answers)
│   │   ├── queues/
│   │   │   └── generation.queue.ts        # BullMQ queue definition
│   │   ├── routes/
│   │   │   └── assignment.routes.ts       # Express routes + multer middleware
│   │   ├── services/
│   │   │   ├── ai.service.ts              # Groq API call + Zod validation of response
│   │   │   ├── assignment.service.ts      # Business logic, Redis caching
│   │   │   ├── file.service.ts            # PDF extraction + vision AI for images
│   │   │   └── prompt.service.ts          # Builds the AI prompt from assignment data
│   │   ├── websocket/
│   │   │   └── socket.server.ts           # Socket.IO setup, room management
│   │   └── workers/
│   │       └── generation.worker.ts       # BullMQ worker, step-by-step generation
│   └── .env.example
│
└── frontend/
    ├── app/
    │   ├── page.tsx                        # Dashboard — card grid, search, filter
    │   ├── assignments/new/page.tsx        # Create form — upload, question types, voice
    │   ├── assignments/[id]/page.tsx       # Output — exam paper, answer key, PDF export
    │   └── assignments/[id]/generating/   # Live progress — pulsing orb, step tracker
    ├── components/
    │   ├── create/
    │   │   ├── UploadBox.tsx              # Drag-and-drop file picker
    │   │   ├── QuestionTypeRow.tsx        # Dynamic question type + count + marks row
    │   │   └── VoiceInput.tsx             # Web Speech API mic button
    │   ├── dashboard/
    │   │   ├── AssignmentCard.tsx         # Card with subject badge, due date warning, 3-dot menu
    │   │   └── EmptyState.tsx             # Empty dashboard prompt
    │   ├── generating/
    │   │   └── ProgressSteps.tsx          # Animated step tracker
    │   ├── layout/
    │   │   ├── Sidebar.tsx                # Desktop navigation
    │   │   └── BottomNav.tsx              # Mobile navigation
    │   ├── output/
    │   │   ├── ExamPaper.tsx              # Full paper layout
    │   │   ├── QuestionSection.tsx        # Section with questions + answer reveal
    │   │   └── PDFExport.tsx              # @react-pdf/renderer download button
    │   └── ui/
    │       └── Toast.tsx                  # Slide-in toast notifications
    ├── services/
    │   ├── api.ts                         # Axios client for all API calls
    │   └── socket.ts                      # Socket.IO client, singleton pattern
    ├── store/
    │   ├── assignmentStore.ts             # Assignments list, CRUD actions
    │   ├── generationStore.ts             # Step tracking during generation
    │   └── toastStore.ts                  # Toast queue
    └── types/
        ├── assignment.ts                  # Assignment interface
        └── paper.ts                       # GeneratedPaper, Section, Question interfaces
```

---

## Key Design Decisions

**Vision AI for images** — When a teacher uploads an image (diagram, textbook page), the Groq vision model first describes what it sees in detail. That description is passed to the text model as reference material, producing questions actually grounded in the image content — not generic questions about the subject.

**BullMQ connection** — BullMQ bundles its own ioredis internally. Passing a node-redis client instance causes a `defineCommand is not a function` error at runtime. The worker passes a plain `{ host, port }` object instead, letting BullMQ manage its own Redis connection.

**Progress replay** — `currentStep` is persisted to MongoDB at every step. If the frontend connects after the worker has already progressed (e.g. slow network, page refresh), it fetches the current step from the DB and replays completed steps rather than showing a stale spinner.

**Answer key in same AI call** — Asking the AI for both questions and answers in one call keeps latency low and costs zero extra. Answers are stored in MongoDB but not sent to the client until the teacher explicitly toggles the answer key — avoiding any temptation to peek at the JSON response.

**Groq as AI provider** — Groq's free tier supports both a powerful 70B text model and a vision model. The entire feature set runs at zero AI cost, and swapping providers requires changing only the `baseURL` and model name.

**Zod validation on AI response** — The raw JSON from Groq is validated against a Zod schema before being saved. If the model returns a malformed structure, the job fails cleanly rather than saving corrupt data to the DB.
