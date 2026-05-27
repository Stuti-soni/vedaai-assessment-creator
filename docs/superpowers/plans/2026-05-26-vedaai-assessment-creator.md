# VedaAI Assessment Creator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack AI-powered assessment creator where teachers fill a form, a BullMQ worker generates a structured question paper via the Grok API, and the result is displayed as a professional exam paper with PDF export.

**Architecture:** Monorepo with `frontend/` (Next.js 14 App Router) and `backend/` (Express + TypeScript). Backend uses MongoDB for persistence, Redis + BullMQ for job queuing, and Socket.IO for real-time progress updates. Frontend uses Zustand for state, React Hook Form + Zod for validation, and `@react-pdf/renderer` for PDF export.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Zustand, React Hook Form, Zod, `@react-pdf/renderer`, Express, MongoDB (Mongoose), Redis, BullMQ, Socket.IO, Grok API (OpenAI-compatible, model `grok-3`)

---

## Phase 1: Monorepo Scaffold

### Task 1: Repo scaffold + git setup

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: `.superpowers/` (already exists, add to gitignore)

- [ ] **Step 1: Create root .gitignore**

```gitignore
node_modules/
.env
.env.local
dist/
.next/
.superpowers/
*.log
```

- [ ] **Step 2: Create root README.md**

```markdown
# VedaAI Assessment Creator

AI-powered assignment and question paper generator for teachers.

## Structure

- `frontend/` — Next.js 14 app (deploy to Vercel)
- `backend/` — Express API + BullMQ worker (deploy to Railway)

## Quick Start

See `frontend/README.md` and `backend/README.md` for setup instructions.
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore README.md
git commit -m "chore: init monorepo scaffold"
```

---

## Phase 2: Backend

### Task 2: Backend project init

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`
- Create: `backend/src/server.ts`
- Create: `backend/src/app.ts`

- [ ] **Step 1: Scaffold backend**

```bash
mkdir -p backend/src
cd backend
npm init -y
npm install express mongoose redis bullmq socket.io openai zod cors dotenv
npm install -D typescript ts-node-dev @types/express @types/node @types/cors
npx tsc --init
```

- [ ] **Step 2: Replace backend/tsconfig.json with**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Add scripts to backend/package.json**

Add inside `"scripts"`:
```json
"dev": "ts-node-dev --respawn --transpile-only src/server.ts",
"build": "tsc",
"start": "node dist/server.js"
```

- [ ] **Step 4: Create backend/.env.example**

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
GROK_API_KEY=xai-your-key-here
GROK_BASE_URL=https://api.x.ai/v1
GROK_MODEL=grok-3
FRONTEND_URL=http://localhost:3000
```

- [ ] **Step 5: Create backend/src/app.ts**

```typescript
import express from 'express';
import cors from 'cors';
import { assignmentRoutes } from './routes/assignment.routes';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/assignments', assignmentRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

export { app };
```

- [ ] **Step 6: Create backend/src/server.ts**

```typescript
import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { connectDB } from './lib/db';
import { initSocket } from './websocket/socket.server';
import { startGenerationWorker } from './workers/generation.worker';

const PORT = process.env.PORT || 4000;

async function main() {
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);
  startGenerationWorker();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch(console.error);
```

- [ ] **Step 7: Commit**

```bash
cd ..
git add backend/
git commit -m "chore: scaffold backend project"
```

---

### Task 3: Backend — DB, Redis, and lib setup

**Files:**
- Create: `backend/src/lib/db.ts`
- Create: `backend/src/lib/redis.ts`
- Create: `backend/src/utils/logger.ts`

- [ ] **Step 1: Create backend/src/lib/db.ts**

```typescript
import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
```

- [ ] **Step 2: Create backend/src/lib/redis.ts**

```typescript
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

redis.on('error', (err) => console.error('Redis error:', err));

export async function connectRedis() {
  if (!redis.isOpen) await redis.connect();
  return redis;
}

export { redis };
```

- [ ] **Step 3: Create backend/src/utils/logger.ts**

```typescript
export const logger = {
  info: (msg: string, meta?: object) => console.log(`[INFO] ${msg}`, meta ?? ''),
  error: (msg: string, meta?: object) => console.error(`[ERROR] ${msg}`, meta ?? ''),
  warn: (msg: string, meta?: object) => console.warn(`[WARN] ${msg}`, meta ?? ''),
};
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/lib/ backend/src/utils/
git commit -m "feat(backend): add db, redis, and logger utilities"
```

---

### Task 4: Backend — Mongoose models

**Files:**
- Create: `backend/src/models/Assignment.model.ts`
- Create: `backend/src/models/GeneratedPaper.model.ts`

- [ ] **Step 1: Create backend/src/models/Assignment.model.ts**

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  dueDate: Date;
  additionalInfo?: string;
  questionTypes: IQuestionType[];
  totalQuestions: number;
  totalMarks: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generatedPaperId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const QuestionTypeSchema = new Schema<IQuestionType>({
  type: { type: String, required: true },
  count: { type: Number, required: true, min: 1 },
  marks: { type: Number, required: true, min: 1 },
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    dueDate: { type: Date, required: true },
    additionalInfo: { type: String },
    questionTypes: { type: [QuestionTypeSchema], required: true },
    totalQuestions: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    generatedPaperId: { type: Schema.Types.ObjectId, ref: 'GeneratedPaper' },
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
```

- [ ] **Step 2: Create backend/src/models/GeneratedPaper.model.ts**

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  type: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IGeneratedPaper extends Document {
  assignmentId: mongoose.Types.ObjectId;
  schoolName: string;
  subject: string;
  class: string;
  duration: string;
  totalMarks: number;
  sections: ISection[];
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  marks: { type: Number, required: true },
  type: { type: String, required: true },
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: { type: [QuestionSchema], required: true },
});

const GeneratedPaperSchema = new Schema<IGeneratedPaper>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    schoolName: { type: String, required: true },
    subject: { type: String, required: true },
    class: { type: String, required: true },
    duration: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    sections: { type: [SectionSchema], required: true },
  },
  { timestamps: true }
);

export const GeneratedPaper = mongoose.model<IGeneratedPaper>('GeneratedPaper', GeneratedPaperSchema);
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/models/
git commit -m "feat(backend): add Assignment and GeneratedPaper mongoose models"
```

---

### Task 5: Backend — Zod validators

**Files:**
- Create: `backend/src/lib/validators.ts`

- [ ] **Step 1: Create backend/src/lib/validators.ts**

```typescript
import { z } from 'zod';

export const QuestionTypeSchema = z.object({
  type: z.string().min(1),
  count: z.number().int().min(1),
  marks: z.number().int().min(1),
});

export const CreateAssignmentSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  dueDate: z.string().refine((d) => new Date(d) > new Date(), {
    message: 'Due date must be in the future',
  }),
  additionalInfo: z.string().optional(),
  questionTypes: z.array(QuestionTypeSchema).min(1, 'At least one question type required'),
});

export const AIQuestionSchema = z.object({
  text: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  marks: z.number().int().min(1),
  type: z.string().min(1),
});

export const AISectionSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().min(1),
  questions: z.array(AIQuestionSchema).min(1),
});

export const AIGeneratedPaperSchema = z.object({
  schoolName: z.string().min(1),
  subject: z.string().min(1),
  class: z.string().min(1),
  duration: z.string().min(1),
  totalMarks: z.number().int().min(1),
  sections: z.array(AISectionSchema).min(1),
});

export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;
export type AIGeneratedPaper = z.infer<typeof AIGeneratedPaperSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/lib/validators.ts
git commit -m "feat(backend): add zod validation schemas"
```

---

### Task 6: Backend — Prompt and AI services

**Files:**
- Create: `backend/src/services/prompt.service.ts`
- Create: `backend/src/services/ai.service.ts`

- [ ] **Step 1: Create backend/src/services/prompt.service.ts**

```typescript
import { IAssignment } from '../models/Assignment.model';

export function buildGenerationPrompt(assignment: IAssignment): string {
  const questionBreakdown = assignment.questionTypes
    .map((qt) => `- ${qt.type}: ${qt.count} questions, ${qt.marks} mark(s) each`)
    .join('\n');

  return `You are an expert teacher. Generate a complete question paper as a JSON object.

Assignment details:
- Subject: ${assignment.subject}
- Total Questions: ${assignment.totalQuestions}
- Total Marks: ${assignment.totalMarks}
${assignment.additionalInfo ? `- Additional Instructions: ${assignment.additionalInfo}` : ''}

Question breakdown:
${questionBreakdown}

Rules:
1. Group questions into sections (Section A, Section B, etc.) based on question type.
2. Each section must have a title, an instruction line, and the list of questions.
3. Each question must have: text, difficulty (easy/medium/hard), marks (integer), type (same as section type).
4. Distribute difficulty: roughly 40% easy, 40% medium, 20% hard per section.
5. schoolName should be "Delhi Public School, Bokaro Steel City".
6. class should be "Grade 8".
7. duration should be calculated as "45 minutes" for up to 20 marks, "1 hour" for up to 40, "2 hours" for up to 80, "3 hours" otherwise.
8. Return ONLY valid JSON. No markdown, no explanation.

Required JSON structure:
{
  "schoolName": "string",
  "subject": "string",
  "class": "string",
  "duration": "string",
  "totalMarks": number,
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries N marks.",
      "questions": [
        { "text": "...", "difficulty": "easy", "marks": 2, "type": "Multiple Choice Questions" }
      ]
    }
  ]
}`;
}
```

- [ ] **Step 2: Create backend/src/services/ai.service.ts**

```typescript
import OpenAI from 'openai';
import { AIGeneratedPaperSchema, AIGeneratedPaper } from '../lib/validators';
import { logger } from '../utils/logger';

const client = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: process.env.GROK_BASE_URL || 'https://api.x.ai/v1',
});

export async function generatePaperWithAI(prompt: string): Promise<AIGeneratedPaper> {
  logger.info('Calling Grok API for paper generation');

  const response = await client.chat.completions.create({
    model: process.env.GROK_MODEL || 'grok-3',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error('Empty response from Grok API');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse Grok response as JSON: ${raw.slice(0, 200)}`);
  }

  const result = AIGeneratedPaperSchema.safeParse(parsed);
  if (!result.success) {
    logger.error('Zod validation failed for AI response', { errors: result.error.flatten() });
    throw new Error(`AI response failed validation: ${JSON.stringify(result.error.flatten())}`);
  }

  return result.data;
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/
git commit -m "feat(backend): add prompt and AI service with Grok integration"
```

---

### Task 7: Backend — BullMQ queue and generation worker

**Files:**
- Create: `backend/src/queues/generation.queue.ts`
- Create: `backend/src/workers/generation.worker.ts`

- [ ] **Step 1: Create backend/src/queues/generation.queue.ts**

```typescript
import { Queue } from 'bullmq';
import { redis } from '../lib/redis';

export interface GenerationJobData {
  assignmentId: string;
}

export const generationQueue = new Queue<GenerationJobData>('generation', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
```

- [ ] **Step 2: Create backend/src/workers/generation.worker.ts**

```typescript
import { Worker } from 'bullmq';
import { redis } from '../lib/redis';
import { Assignment } from '../models/Assignment.model';
import { GeneratedPaper } from '../models/GeneratedPaper.model';
import { buildGenerationPrompt } from '../services/prompt.service';
import { generatePaperWithAI } from '../services/ai.service';
import { getIO } from '../websocket/socket.server';
import { logger } from '../utils/logger';
import { GenerationJobData } from '../queues/generation.queue';

export function startGenerationWorker() {
  const worker = new Worker<GenerationJobData>(
    'generation',
    async (job) => {
      const { assignmentId } = job.data;
      const io = getIO();

      try {
        // Step 1: Mark as processing
        await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });
        io.to(assignmentId).emit('generation-progress', { step: 2, message: 'Processing request' });

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

        // Step 2: Build prompt and call AI
        io.to(assignmentId).emit('generation-progress', { step: 3, message: 'Generating questions' });
        const prompt = buildGenerationPrompt(assignment);
        const paperData = await generatePaperWithAI(prompt);

        // Step 3: Structure and save
        io.to(assignmentId).emit('generation-progress', { step: 4, message: 'Structuring paper' });
        const generatedPaper = await GeneratedPaper.create({
          ...paperData,
          assignmentId: assignment._id,
        });

        // Step 4: Finalize
        io.to(assignmentId).emit('generation-progress', { step: 5, message: 'Finalizing' });
        await Assignment.findByIdAndUpdate(assignmentId, {
          status: 'completed',
          generatedPaperId: generatedPaper._id,
        });

        io.to(assignmentId).emit('assignment-completed', { assignmentId, paperId: generatedPaper._id });
        logger.info(`Generation completed for assignment ${assignmentId}`);
      } catch (err) {
        logger.error(`Generation failed for assignment ${assignmentId}`, { err });
        await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
        io.to(assignmentId).emit('assignment-failed', {
          assignmentId,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
        throw err;
      }
    },
    { connection: redis, concurrency: 3 }
  );

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed`, { err: err.message });
  });

  logger.info('Generation worker started');
  return worker;
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/queues/ backend/src/workers/
git commit -m "feat(backend): add BullMQ generation queue and worker"
```

---

### Task 8: Backend — Socket.IO server

**Files:**
- Create: `backend/src/websocket/socket.server.ts`

- [ ] **Step 1: Create backend/src/websocket/socket.server.ts**

```typescript
import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { logger } from '../utils/logger';

let io: SocketServer;

export function initSocket(server: HTTPServer) {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join-room', (assignmentId: string) => {
      socket.join(assignmentId);
      logger.info(`Socket ${socket.id} joined room ${assignmentId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.IO initialized');
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.IO not initialized — call initSocket first');
  return io;
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/websocket/
git commit -m "feat(backend): add Socket.IO server with room management"
```

---

### Task 9: Backend — Assignment service and controller

**Files:**
- Create: `backend/src/services/assignment.service.ts`
- Create: `backend/src/controllers/assignment.controller.ts`
- Create: `backend/src/routes/assignment.routes.ts`

- [ ] **Step 1: Create backend/src/services/assignment.service.ts**

```typescript
import { Assignment } from '../models/Assignment.model';
import { GeneratedPaper } from '../models/GeneratedPaper.model';
import { generationQueue } from '../queues/generation.queue';
import { CreateAssignmentInput } from '../lib/validators';
import { redis } from '../lib/redis';

const CACHE_TTL = 30; // seconds

export async function createAssignment(input: CreateAssignmentInput) {
  const totalQuestions = input.questionTypes.reduce((sum, qt) => sum + qt.count, 0);
  const totalMarks = input.questionTypes.reduce((sum, qt) => sum + qt.count * qt.marks, 0);
  const title = `${input.subject} Assignment`;

  const assignment = await Assignment.create({
    title,
    subject: input.subject,
    dueDate: new Date(input.dueDate),
    additionalInfo: input.additionalInfo,
    questionTypes: input.questionTypes,
    totalQuestions,
    totalMarks,
    status: 'pending',
  });

  await generationQueue.add('generate', { assignmentId: assignment._id.toString() });
  return assignment;
}

export async function listAssignments() {
  const cacheKey = 'assignments:list';
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const assignments = await Assignment.find({})
    .select('title subject dueDate status totalQuestions totalMarks createdAt')
    .sort({ createdAt: -1 })
    .lean();

  await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(assignments));
  return assignments;
}

export async function getAssignmentById(id: string) {
  const assignment = await Assignment.findById(id).lean();
  if (!assignment) return null;

  let generatedPaper = null;
  if (assignment.generatedPaperId) {
    generatedPaper = await GeneratedPaper.findById(assignment.generatedPaperId).lean();
  }

  return { assignment, generatedPaper };
}

export async function regenerateAssignment(id: string) {
  const assignment = await Assignment.findByIdAndUpdate(
    id,
    { status: 'pending', generatedPaperId: null },
    { new: true }
  );
  if (!assignment) return null;

  await generationQueue.add('generate', { assignmentId: id });
  return assignment;
}
```

- [ ] **Step 2: Create backend/src/controllers/assignment.controller.ts**

```typescript
import { Request, Response } from 'express';
import { CreateAssignmentSchema } from '../lib/validators';
import * as AssignmentService from '../services/assignment.service';
import { logger } from '../utils/logger';

export async function createAssignment(req: Request, res: Response) {
  const parsed = CreateAssignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const assignment = await AssignmentService.createAssignment(parsed.data);
    return res.status(201).json(assignment);
  } catch (err) {
    logger.error('createAssignment failed', { err });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listAssignments(_req: Request, res: Response) {
  try {
    const assignments = await AssignmentService.listAssignments();
    return res.json(assignments);
  } catch (err) {
    logger.error('listAssignments failed', { err });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAssignment(req: Request, res: Response) {
  try {
    const result = await AssignmentService.getAssignmentById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Assignment not found' });
    return res.json(result);
  } catch (err) {
    logger.error('getAssignment failed', { err });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function regenerateAssignment(req: Request, res: Response) {
  try {
    const assignment = await AssignmentService.regenerateAssignment(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    return res.json(assignment);
  } catch (err) {
    logger.error('regenerateAssignment failed', { err });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

- [ ] **Step 3: Create backend/src/routes/assignment.routes.ts**

```typescript
import { Router } from 'express';
import * as AssignmentController from '../controllers/assignment.controller';

const router = Router();

router.post('/', AssignmentController.createAssignment);
router.get('/', AssignmentController.listAssignments);
router.get('/:id', AssignmentController.getAssignment);
router.post('/:id/regenerate', AssignmentController.regenerateAssignment);

export { router as assignmentRoutes };
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/assignment.service.ts backend/src/controllers/ backend/src/routes/
git commit -m "feat(backend): add assignment service, controller, and routes"
```

---

### Task 10: Backend — Smoke test

- [ ] **Step 1: Copy .env.example to .env and fill values**

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your real GROK_API_KEY, MONGODB_URI, REDIS_URL
```

- [ ] **Step 2: Start MongoDB and Redis locally**

```bash
# If using Docker:
docker run -d -p 27017:27017 --name mongo mongo:7
docker run -d -p 6379:6379 --name redis redis:7
```

- [ ] **Step 3: Start the backend dev server**

```bash
cd backend && npm run dev
```

Expected output:
```
MongoDB connected
Socket.IO initialized
Generation worker started
Server running on port 4000
```

- [ ] **Step 4: Test health endpoint**

```bash
curl http://localhost:4000/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 5: Test create assignment**

```bash
curl -X POST http://localhost:4000/api/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Science",
    "dueDate": "2026-12-31",
    "questionTypes": [
      { "type": "Multiple Choice Questions", "count": 4, "marks": 1 },
      { "type": "Short Questions", "count": 3, "marks": 2 }
    ]
  }'
```

Expected: `201` with assignment object including `"status": "pending"` and an `_id`.

- [ ] **Step 6: Test list assignments**

```bash
curl http://localhost:4000/api/assignments
```

Expected: JSON array with at least one assignment.

- [ ] **Step 7: Commit backend README**

Create `backend/README.md`:
```markdown
# VedaAI Backend

## Setup

1. Copy `.env.example` to `.env` and fill in values
2. Start MongoDB and Redis (Docker or local)
3. `npm install`
4. `npm run dev`

## Environment Variables

See `.env.example` for all required variables.

## API

- `POST /api/assignments` — Create assignment + trigger generation
- `GET /api/assignments` — List all assignments
- `GET /api/assignments/:id` — Get assignment with generated paper
- `POST /api/assignments/:id/regenerate` — Re-trigger generation
```

```bash
git add backend/README.md
git commit -m "docs(backend): add README with setup instructions"
```

---

## Phase 3: Frontend

### Task 11: Frontend project init

**Files:**
- Create: `frontend/` (Next.js project)

- [ ] **Step 1: Create Next.js app**

```bash
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
cd frontend
```

- [ ] **Step 2: Install dependencies**

```bash
npm install zustand react-hook-form zod @hookform/resolvers axios socket.io-client @react-pdf/renderer
npm install -D @types/react-pdf
```

- [ ] **Step 3: Create frontend/.env.local**

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

- [ ] **Step 4: Update frontend/app/globals.css — keep only Tailwind directives**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/
git commit -m "chore: scaffold Next.js frontend"
```

---

### Task 12: Frontend — Types and Zod schemas

**Files:**
- Create: `frontend/types/assignment.ts`
- Create: `frontend/types/paper.ts`
- Create: `frontend/lib/validators.ts`

- [ ] **Step 1: Create frontend/types/assignment.ts**

```typescript
export interface QuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  dueDate: string;
  additionalInfo?: string;
  questionTypes: QuestionType[];
  totalQuestions: number;
  totalMarks: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generatedPaperId?: string;
  createdAt: string;
}
```

- [ ] **Step 2: Create frontend/types/paper.ts**

```typescript
export interface Question {
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  type: string;
}

export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface GeneratedPaper {
  _id: string;
  assignmentId: string;
  schoolName: string;
  subject: string;
  class: string;
  duration: string;
  totalMarks: number;
  sections: Section[];
  createdAt: string;
}
```

- [ ] **Step 3: Create frontend/lib/validators.ts**

```typescript
import { z } from 'zod';

export const QuestionTypeSchema = z.object({
  type: z.string().min(1, 'Question type is required'),
  count: z.coerce.number().int().min(1, 'Min 1 question'),
  marks: z.coerce.number().int().min(1, 'Min 1 mark'),
});

export const CreateAssignmentSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  dueDate: z.string().refine((d) => new Date(d) > new Date(), {
    message: 'Due date must be in the future',
  }),
  additionalInfo: z.string().optional(),
  questionTypes: z.array(QuestionTypeSchema).min(1, 'Add at least one question type'),
});

export type CreateAssignmentFormValues = z.infer<typeof CreateAssignmentSchema>;
```

- [ ] **Step 4: Commit**

```bash
git add frontend/types/ frontend/lib/
git commit -m "feat(frontend): add types and form validation schemas"
```

---

### Task 13: Frontend — API and Socket services

**Files:**
- Create: `frontend/services/api.ts`
- Create: `frontend/services/socket.ts`

- [ ] **Step 1: Create frontend/services/api.ts**

```typescript
import axios from 'axios';
import { Assignment } from '@/types/assignment';
import { GeneratedPaper } from '@/types/paper';
import { CreateAssignmentFormValues } from '@/lib/validators';

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
});

export const api = {
  createAssignment: (data: CreateAssignmentFormValues) =>
    client.post<Assignment>('/api/assignments', data).then((r) => r.data),

  listAssignments: () =>
    client.get<Assignment[]>('/api/assignments').then((r) => r.data),

  getAssignment: (id: string) =>
    client
      .get<{ assignment: Assignment; generatedPaper: GeneratedPaper | null }>(`/api/assignments/${id}`)
      .then((r) => r.data),

  regenerateAssignment: (id: string) =>
    client.post<Assignment>(`/api/assignments/${id}/regenerate`).then((r) => r.data),
};
```

- [ ] **Step 2: Create frontend/services/socket.ts**

```typescript
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/services/
git commit -m "feat(frontend): add API client and Socket.IO service"
```

---

### Task 14: Frontend — Zustand stores

**Files:**
- Create: `frontend/store/assignmentStore.ts`
- Create: `frontend/store/generationStore.ts`

- [ ] **Step 1: Create frontend/store/assignmentStore.ts**

```typescript
import { create } from 'zustand';
import { Assignment } from '@/types/assignment';
import { api } from '@/services/api';

interface AssignmentStore {
  assignments: Assignment[];
  loading: boolean;
  fetchAssignments: () => Promise<void>;
  addAssignment: (a: Assignment) => void;
  updateAssignmentStatus: (id: string, status: Assignment['status']) => void;
}

export const useAssignmentStore = create<AssignmentStore>((set) => ({
  assignments: [],
  loading: false,

  fetchAssignments: async () => {
    set({ loading: true });
    try {
      const data = await api.listAssignments();
      set({ assignments: data });
    } finally {
      set({ loading: false });
    }
  },

  addAssignment: (assignment) =>
    set((state) => ({ assignments: [assignment, ...state.assignments] })),

  updateAssignmentStatus: (id, status) =>
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a._id === id ? { ...a, status } : a
      ),
    })),
}));
```

- [ ] **Step 2: Create frontend/store/generationStore.ts**

```typescript
import { create } from 'zustand';

export interface ProgressStep {
  step: number;
  message: string;
  completed: boolean;
}

const INITIAL_STEPS: ProgressStep[] = [
  { step: 1, message: 'Creating job', completed: false },
  { step: 2, message: 'Processing request', completed: false },
  { step: 3, message: 'Generating questions', completed: false },
  { step: 4, message: 'Structuring paper', completed: false },
  { step: 5, message: 'Finalizing', completed: false },
];

interface GenerationStore {
  steps: ProgressStep[];
  currentStep: number;
  failed: boolean;
  failMessage: string;
  resetGeneration: () => void;
  markStepComplete: (step: number) => void;
  setFailed: (message: string) => void;
}

export const useGenerationStore = create<GenerationStore>((set) => ({
  steps: INITIAL_STEPS,
  currentStep: 1,
  failed: false,
  failMessage: '',

  resetGeneration: () =>
    set({ steps: INITIAL_STEPS.map((s) => ({ ...s, completed: false })), currentStep: 1, failed: false, failMessage: '' }),

  markStepComplete: (step) =>
    set((state) => ({
      steps: state.steps.map((s) => (s.step <= step ? { ...s, completed: true } : s)),
      currentStep: step + 1,
    })),

  setFailed: (message) => set({ failed: true, failMessage: message }),
}));
```

- [ ] **Step 3: Commit**

```bash
git add frontend/store/
git commit -m "feat(frontend): add Zustand stores for assignments and generation"
```

---

### Task 15: Frontend — Layout components (Sidebar + BottomNav)

**Files:**
- Create: `frontend/components/layout/Sidebar.tsx`
- Create: `frontend/components/layout/BottomNav.tsx`
- Modify: `frontend/app/layout.tsx`

- [ ] **Step 1: Create frontend/components/layout/Sidebar.tsx**

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Wrench, Library, Settings } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/', label: 'My Groups', icon: BookOpen },
  { href: '/', label: 'Assignments', icon: BookOpen },
  { href: '/', label: "AI Teacher's Toolkit", icon: Wrench },
  { href: '/', label: 'My Library', icon: Library },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-gray-200 py-6 px-4">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">V</span>
        </div>
        <span className="font-bold text-lg text-gray-900">VedaAI</span>
      </div>

      <Link
        href="/assignments/new"
        className="flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium mb-6 hover:bg-gray-700 transition-colors"
      >
        + Create Assignment
      </Link>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.label === 'Assignments' && pathname === '/';
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-orange-50 text-orange-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-200">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
          <Settings size={16} />
          Settings
        </Link>
        <div className="flex items-center gap-3 px-3 py-2 mt-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-medium text-orange-700">
            DP
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Delhi Public School</p>
            <p className="text-xs text-gray-500">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Install lucide-react**

```bash
cd frontend && npm install lucide-react && cd ..
```

- [ ] **Step 3: Create frontend/components/layout/BottomNav.tsx**

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Library, Wrench } from 'lucide-react';

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/', label: 'Assignments', icon: BookOpen },
  { href: '/', label: 'Library', icon: Library },
  { href: '/', label: 'AI Tools', icon: Wrench },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-4 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.label === 'Assignments' && pathname === '/';
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors ${
                active ? 'text-orange-500' : 'text-gray-500'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Update frontend/app/layout.tsx**

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VedaAI — Assessment Creator',
  description: 'AI-powered question paper generator for teachers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/components/layout/ frontend/app/layout.tsx
git commit -m "feat(frontend): add Sidebar and BottomNav layout components"
```

---

### Task 16: Frontend — Dashboard page

**Files:**
- Create: `frontend/components/dashboard/EmptyState.tsx`
- Create: `frontend/components/dashboard/AssignmentCard.tsx`
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: Create frontend/components/dashboard/EmptyState.tsx**

```tsx
import Link from 'next/link';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="w-32 h-32 mb-6 relative">
        <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="2" />
            <path d="M20 32h24M32 20v24" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
            <circle cx="44" cy="20" r="8" fill="#fee2e2" />
            <path d="M41 20h6M44 17v6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">No assignments yet</h2>
      <p className="text-gray-500 text-sm max-w-sm mb-8">
        Create your first assignment to start collecting and grading student submissions. You can set
        up rubrics, define marking criteria, and let AI assist with grading.
      </p>
      <Link
        href="/assignments/new"
        className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors"
      >
        + Create Your First Assignment
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Create frontend/components/dashboard/AssignmentCard.tsx**

```tsx
import Link from 'next/link';
import { Assignment } from '@/types/assignment';
import { MoreVertical } from 'lucide-react';

const statusStyles: Record<Assignment['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const due = new Date(assignment.dueDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{assignment.title}</h3>
          <p className="text-xs text-gray-500 mt-1">
            Assigned on{' '}
            {new Date(assignment.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}{' '}
            &nbsp; Due {due}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[assignment.status]}`}>
            {assignment.status}
          </span>
          <button className="text-gray-400 hover:text-gray-600 p-1">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
      {assignment.status === 'completed' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Link
            href={`/assignments/${assignment._id}`}
            className="text-xs text-orange-600 font-medium hover:underline"
          >
            View Assignment →
          </Link>
        </div>
      )}
      {assignment.status === 'processing' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Link
            href={`/assignments/${assignment._id}/generating`}
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            View Progress →
          </Link>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Replace frontend/app/page.tsx**

```tsx
'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useAssignmentStore } from '@/store/assignmentStore';
import { AssignmentCard } from '@/components/dashboard/AssignmentCard';
import { EmptyState } from '@/components/dashboard/EmptyState';

export default function DashboardPage() {
  const { assignments, loading, fetchAssignments } = useAssignmentStore();

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>← </span>
          <span className="text-gray-900 font-medium">Assignment</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-gray-500 hover:text-gray-700">
            <Bell size={20} />
          </button>
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-medium text-orange-700">
            JD
          </div>
        </div>
      </div>

      {/* Title row */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Assignments</h1>
        <Link
          href="/assignments/new"
          className="md:hidden inline-flex items-center gap-1 bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium"
        >
          + Create
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {assignments.map((a) => (
            <AssignmentCard key={a._id} assignment={a} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/components/dashboard/ frontend/app/page.tsx
git commit -m "feat(frontend): add dashboard page with empty state and assignment cards"
```

---

### Task 17: Frontend — Create Assignment form

**Files:**
- Create: `frontend/components/create/UploadBox.tsx`
- Create: `frontend/components/create/QuestionTypeRow.tsx`
- Create: `frontend/app/assignments/new/page.tsx`

- [ ] **Step 1: Create frontend/components/create/UploadBox.tsx**

```tsx
import { Upload } from 'lucide-react';

export function UploadBox() {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
      <Upload className="mx-auto mb-3 text-gray-400" size={28} />
      <p className="text-sm font-medium text-gray-700 mb-1">Choose a file or drag & drop it here</p>
      <p className="text-xs text-gray-400 mb-3">PDF, PNG, JPG — max 10MB</p>
      <button
        type="button"
        className="text-xs border border-gray-300 rounded-lg px-4 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
      >
        Browse Files
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create frontend/components/create/QuestionTypeRow.tsx**

```tsx
import { X } from 'lucide-react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { CreateAssignmentFormValues } from '@/lib/validators';

const QUESTION_TYPE_OPTIONS = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Questions',
  'Diagrams/Graph-Based Questions',
  'Numerical Problems',
  'Fill in the Blanks',
  'True/False',
];

interface Props {
  index: number;
  register: UseFormRegister<CreateAssignmentFormValues>;
  errors: FieldErrors<CreateAssignmentFormValues>;
  onRemove: () => void;
  canRemove: boolean;
}

export function QuestionTypeRow({ index, register, errors, onRemove, canRemove }: Props) {
  const typeError = errors.questionTypes?.[index]?.type?.message;
  const countError = errors.questionTypes?.[index]?.count?.message;
  const marksError = errors.questionTypes?.[index]?.marks?.message;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        {...register(`questionTypes.${index}.type`)}
        className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
      >
        <option value="">Select type</option>
        {QUESTION_TYPE_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-gray-500 hidden sm:block">No. of Questions</span>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <span className="px-2 py-2 text-sm text-gray-500">—</span>
          <input
            type="number"
            min={1}
            {...register(`questionTypes.${index}.count`)}
            className="w-12 text-center text-sm py-2 border-x border-gray-200 focus:outline-none"
          />
          <span className="px-2 py-2 text-sm text-gray-500">+</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-gray-500 hidden sm:block">Marks</span>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <span className="px-2 py-2 text-sm text-gray-500">—</span>
          <input
            type="number"
            min={1}
            {...register(`questionTypes.${index}.marks`)}
            className="w-12 text-center text-sm py-2 border-x border-gray-200 focus:outline-none"
          />
          <span className="px-2 py-2 text-sm text-gray-500">+</span>
        </div>
      </div>

      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
        >
          <X size={16} />
        </button>
      )}

      {(typeError || countError || marksError) && (
        <p className="w-full text-xs text-red-500">{typeError || countError || marksError}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create frontend/app/assignments/new/page.tsx**

```tsx
'use client';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { CreateAssignmentSchema, CreateAssignmentFormValues } from '@/lib/validators';
import { QuestionTypeRow } from '@/components/create/QuestionTypeRow';
import { UploadBox } from '@/components/create/UploadBox';
import { api } from '@/services/api';
import { useAssignmentStore } from '@/store/assignmentStore';

export default function NewAssignmentPage() {
  const router = useRouter();
  const addAssignment = useAssignmentStore((s) => s.addAssignment);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateAssignmentFormValues>({
    resolver: zodResolver(CreateAssignmentSchema),
    defaultValues: {
      subject: '',
      dueDate: '',
      additionalInfo: '',
      questionTypes: [{ type: '', count: 1, marks: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'questionTypes' });

  const questionTypes = watch('questionTypes');
  const totalQuestions = questionTypes.reduce((s, qt) => s + (Number(qt.count) || 0), 0);
  const totalMarks = questionTypes.reduce((s, qt) => s + (Number(qt.count) || 0) * (Number(qt.marks) || 0), 0);

  async function onSubmit(data: CreateAssignmentFormValues) {
    const assignment = await api.createAssignment(data);
    addAssignment(assignment);
    router.push(`/assignments/${assignment._id}/generating`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Create Assignment</h1>
          <p className="text-sm text-gray-500">Set up a new assignment for your students</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Assignment Details section */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-medium text-gray-900">Assignment Details</h2>
          <p className="text-xs text-gray-500 -mt-2">Basic information about your assignment</p>

          <UploadBox />
          <p className="text-xs text-gray-400 text-center">Upload images of your preferred document/image</p>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Due Date</label>
            <input
              type="date"
              {...register('dueDate')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Subject</label>
            <input
              {...register('subject')}
              placeholder="e.g. Science, Mathematics"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
          </div>

          {/* Question Types */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Question Type</label>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>No. of Questions</span>
                <span>Marks</span>
              </div>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <QuestionTypeRow
                  key={field.id}
                  index={index}
                  register={register}
                  errors={errors}
                  onRemove={() => remove(index)}
                  canRemove={fields.length > 1}
                />
              ))}
            </div>

            {errors.questionTypes?.root && (
              <p className="text-xs text-red-500 mt-1">{errors.questionTypes.root.message}</p>
            )}

            <button
              type="button"
              onClick={() => append({ type: '', count: 1, marks: 1 })}
              className="mt-3 flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              <Plus size={16} />
              Add Question Type
            </button>
          </div>

          {/* Totals */}
          <div className="flex justify-end gap-6 pt-2 border-t border-gray-100 text-sm text-gray-600">
            <span>Total Questions: <strong>{totalQuestions}</strong></span>
            <span>Total Marks: <strong>{totalMarks}</strong></span>
          </div>

          {/* Additional info */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Additional Information <span className="text-gray-400 font-normal">(For better output)</span>
            </label>
            <textarea
              {...register('additionalInfo')}
              placeholder="e.g. Generate a question paper for a 3-hour exam duration..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Previous
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Creating...' : 'Next'}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/components/create/ frontend/app/assignments/
git commit -m "feat(frontend): add create assignment form with dynamic question type rows"
```

---

### Task 18: Frontend — Generating / progress page

**Files:**
- Create: `frontend/components/generating/ProgressSteps.tsx`
- Create: `frontend/app/assignments/[id]/generating/page.tsx`

- [ ] **Step 1: Create frontend/components/generating/ProgressSteps.tsx**

```tsx
import { Check, Loader2 } from 'lucide-react';
import { ProgressStep } from '@/store/generationStore';

export function ProgressSteps({ steps, currentStep }: { steps: ProgressStep[]; currentStep: number }) {
  return (
    <div className="space-y-3 w-full max-w-sm">
      {steps.map((step) => {
        const isActive = step.step === currentStep;
        const isDone = step.completed;

        return (
          <div key={step.step} className="flex items-center gap-3">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                isDone
                  ? 'bg-green-500 text-white'
                  : isActive
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {isDone ? (
                <Check size={14} />
              ) : isActive ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <span className="text-xs">{step.step}</span>
              )}
            </div>
            <span
              className={`text-sm ${
                isDone ? 'text-gray-500 line-through' : isActive ? 'text-gray-900 font-medium' : 'text-gray-400'
              }`}
            >
              {step.message}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create frontend/app/assignments/[id]/generating/page.tsx**

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProgressSteps } from '@/components/generating/ProgressSteps';
import { useGenerationStore } from '@/store/generationStore';
import { connectSocket, disconnectSocket } from '@/services/socket';

export default function GeneratingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { steps, currentStep, failed, failMessage, resetGeneration, markStepComplete, setFailed } =
    useGenerationStore();
  const joined = useRef(false);

  useEffect(() => {
    resetGeneration();
    markStepComplete(1); // "Creating job" is already done by the time we land here

    if (joined.current) return;
    joined.current = true;

    const socket = connectSocket();

    socket.emit('join-room', params.id);

    socket.on('generation-progress', ({ step }: { step: number; message: string }) => {
      markStepComplete(step - 1);
    });

    socket.on('assignment-completed', () => {
      markStepComplete(5);
      setTimeout(() => {
        router.push(`/assignments/${params.id}`);
      }, 800);
    });

    socket.on('assignment-failed', ({ message }: { message: string }) => {
      setFailed(message);
    });

    return () => {
      socket.off('generation-progress');
      socket.off('assignment-completed');
      socket.off('assignment-failed');
      disconnectSocket();
    };
  }, [params.id]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-6">
        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">V</span>
        </div>
      </div>

      {!failed ? (
        <>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Generating your question paper...</h1>
          <p className="text-sm text-gray-500 mb-10">This usually takes 15–30 seconds</p>
          <ProgressSteps steps={steps} currentStep={currentStep} />
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold text-red-600 mb-2">Generation failed</h1>
          <p className="text-sm text-gray-500 mb-6">{failMessage}</p>
          <button
            onClick={() => router.push(`/assignments/${params.id}/generating`)}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
          >
            Try Again
          </button>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/components/generating/ frontend/app/assignments/
git commit -m "feat(frontend): add generating progress page with WebSocket step tracking"
```

---

### Task 19: Frontend — Output / exam paper page

**Files:**
- Create: `frontend/components/output/DifficultyBadge.tsx`
- Create: `frontend/components/output/QuestionSection.tsx`
- Create: `frontend/components/output/ExamPaper.tsx`
- Create: `frontend/app/assignments/[id]/page.tsx`

- [ ] **Step 1: Create frontend/components/output/DifficultyBadge.tsx**

```tsx
const styles = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

export function DifficultyBadge({ difficulty }: { difficulty: 'easy' | 'medium' | 'hard' }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${styles[difficulty]}`}>
      {difficulty}
    </span>
  );
}
```

- [ ] **Step 2: Create frontend/components/output/QuestionSection.tsx**

```tsx
import { Section } from '@/types/paper';
import { DifficultyBadge } from './DifficultyBadge';

export function QuestionSection({ section, startIndex }: { section: Section; startIndex: number }) {
  return (
    <div className="mb-8">
      <div className="mb-3">
        <h3 className="font-bold text-gray-900 text-base">{section.title}</h3>
        <p className="text-sm text-gray-600 italic">{section.instruction}</p>
      </div>
      <ol className="space-y-4" start={startIndex}>
        {section.questions.map((q, i) => (
          <li key={i} className="flex gap-3">
            <span className="text-sm font-medium text-gray-700 shrink-0 w-6">{startIndex + i}.</span>
            <div className="flex-1">
              <p className="text-sm text-gray-800 leading-relaxed">{q.text}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <DifficultyBadge difficulty={q.difficulty} />
                <span className="text-xs text-gray-400">[{q.marks} mark{q.marks > 1 ? 's' : ''}]</span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 3: Create frontend/components/output/ExamPaper.tsx**

```tsx
import { GeneratedPaper } from '@/types/paper';
import { QuestionSection } from './QuestionSection';

export function ExamPaper({ paper }: { paper: GeneratedPaper }) {
  let questionIndex = 1;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-3xl mx-auto font-serif">
      {/* Header */}
      <div className="text-center border-b border-gray-300 pb-4 mb-6">
        <h1 className="text-lg font-bold text-gray-900">{paper.schoolName}</h1>
        <p className="text-sm text-gray-700 mt-1">Subject: {paper.subject}</p>
        <p className="text-sm text-gray-700">Class: {paper.class}</p>
        <div className="flex justify-between text-xs text-gray-600 mt-3">
          <span>Time Allowed: {paper.duration}</span>
          <span>Maximum Marks: {paper.totalMarks}</span>
        </div>
        <p className="text-xs text-gray-500 italic mt-2">All questions are compulsory unless stated otherwise.</p>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
        <div>
          Name: <span className="border-b border-gray-400 inline-block w-24">&nbsp;</span>
        </div>
        <div>
          Roll Number: <span className="border-b border-gray-400 inline-block w-20">&nbsp;</span>
        </div>
        <div>
          Class: <span className="border-b border-gray-400 inline-block w-20">&nbsp;</span>
        </div>
      </div>

      {/* Sections */}
      {paper.sections.map((section, i) => {
        const el = (
          <QuestionSection key={i} section={section} startIndex={questionIndex} />
        );
        questionIndex += section.questions.length;
        return el;
      })}

      <p className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4 mt-4 italic">
        End of Question Paper
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Create frontend/app/assignments/[id]/page.tsx**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RotateCcw, Download } from 'lucide-react';
import { ExamPaper } from '@/components/output/ExamPaper';
import { api } from '@/services/api';
import { GeneratedPaper } from '@/types/paper';
import { Assignment } from '@/types/assignment';
import dynamic from 'next/dynamic';

const PDFExport = dynamic(() => import('@/components/output/PDFExport').then((m) => m.PDFExport), {
  ssr: false,
  loading: () => (
    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
      <Download size={16} /> Download PDF
    </button>
  ),
});

export default function AssignmentOutputPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    api.getAssignment(params.id).then(({ assignment, generatedPaper }) => {
      setAssignment(assignment);
      setPaper(generatedPaper);
      setLoading(false);
    });
  }, [params.id]);

  async function handleRegenerate() {
    setRegenerating(true);
    await api.regenerateAssignment(params.id);
    router.push(`/assignments/${params.id}/generating`);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-full mb-2" />
            <div className="h-3 bg-gray-100 rounded w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">No question paper found for this assignment.</p>
        <button
          onClick={handleRegenerate}
          className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
        >
          Generate Now
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Action bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{assignment?.title}</h1>
          <p className="text-sm text-gray-500">Here are your customised Question Paper for your class</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw size={16} />
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
          <PDFExport paper={paper} />
        </div>
      </div>

      <ExamPaper paper={paper} />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/components/output/ frontend/app/assignments/
git commit -m "feat(frontend): add exam paper output page with difficulty badges"
```

---

### Task 20: Frontend — PDF export component

**Files:**
- Create: `frontend/components/output/PDFExport.tsx`

- [ ] **Step 1: Create frontend/components/output/PDFExport.tsx**

```tsx
'use client';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { GeneratedPaper } from '@/types/paper';
import { Download } from 'lucide-react';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { textAlign: 'center', marginBottom: 16, borderBottom: '1pt solid #ccc', paddingBottom: 10 },
  schoolName: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 10, marginBottom: 2, color: '#444' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: '#555' },
  studentInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, fontSize: 10 },
  fieldLine: { borderBottom: '0.5pt solid #999', width: 80, marginLeft: 4 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  sectionInstruction: { fontSize: 9, color: '#555', fontStyle: 'italic', marginBottom: 8 },
  question: { flexDirection: 'row', marginBottom: 8, gap: 6 },
  questionNumber: { width: 18, fontSize: 10 },
  questionText: { flex: 1, fontSize: 10, lineHeight: 1.5 },
  difficultyRow: { flexDirection: 'row', gap: 6, marginTop: 3 },
  badge: { fontSize: 8, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  easyBadge: { backgroundColor: '#d1fae5', color: '#065f46' },
  mediumBadge: { backgroundColor: '#fef9c3', color: '#713f12' },
  hardBadge: { backgroundColor: '#fee2e2', color: '#991b1b' },
  marksText: { fontSize: 8, color: '#888' },
  footer: { textAlign: 'center', fontSize: 8, color: '#aaa', marginTop: 20, borderTop: '0.5pt solid #eee', paddingTop: 8 },
  section: { marginBottom: 18 },
});

function PaperDocument({ paper }: { paper: GeneratedPaper }) {
  let qIndex = 1;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.schoolName}>{paper.schoolName}</Text>
          <Text style={styles.subtitle}>Subject: {paper.subject}</Text>
          <Text style={styles.subtitle}>Class: {paper.class}</Text>
          <View style={styles.metaRow}>
            <Text>Time Allowed: {paper.duration}</Text>
            <Text>Maximum Marks: {paper.totalMarks}</Text>
          </View>
        </View>

        <View style={styles.studentInfo}>
          <Text>Name: <Text style={styles.fieldLine}>{'                    '}</Text></Text>
          <Text>Roll Number: <Text style={styles.fieldLine}>{'               '}</Text></Text>
          <Text>Class: <Text style={styles.fieldLine}>{'               '}</Text></Text>
        </View>

        {paper.sections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionInstruction}>{section.instruction}</Text>
            {section.questions.map((q, qi) => {
              const num = qIndex++;
              const badgeStyle =
                q.difficulty === 'easy' ? styles.easyBadge
                : q.difficulty === 'medium' ? styles.mediumBadge
                : styles.hardBadge;
              return (
                <View key={qi} style={styles.question}>
                  <Text style={styles.questionNumber}>{num}.</Text>
                  <View style={styles.questionText}>
                    <Text>{q.text}</Text>
                    <View style={styles.difficultyRow}>
                      <Text style={[styles.badge, badgeStyle]}>{q.difficulty}</Text>
                      <Text style={styles.marksText}>[{q.marks} mark{q.marks > 1 ? 's' : ''}]</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        <Text style={styles.footer}>End of Question Paper</Text>
      </Page>
    </Document>
  );
}

export function PDFExport({ paper }: { paper: GeneratedPaper }) {
  const filename = `${paper.subject.replace(/\s+/g, '_')}_question_paper.pdf`;
  return (
    <PDFDownloadLink document={<PaperDocument paper={paper} />} fileName={filename}>
      {({ loading }) => (
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
          <Download size={16} />
          {loading ? 'Preparing PDF...' : 'Download PDF'}
        </button>
      )}
    </PDFDownloadLink>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/output/PDFExport.tsx
git commit -m "feat(frontend): add PDF export using @react-pdf/renderer"
```

---

## Phase 4: Integration & Deployment

### Task 21: End-to-end smoke test

- [ ] **Step 1: Start backend**
```bash
cd backend && npm run dev
```

- [ ] **Step 2: Start frontend**
```bash
cd frontend && npm run dev
```

- [ ] **Step 3: Open http://localhost:3000**

Expected: Dashboard with "No assignments yet" empty state and "Create Your First Assignment" button.

- [ ] **Step 4: Create an assignment**

Click "Create Your First Assignment" → fill in Subject: "Science", set a future due date, add 2 question types (MCQ: 4 questions, 1 mark; Short: 3 questions, 2 marks) → click Next.

Expected: Redirected to `/assignments/[id]/generating` with progress steps animating.

- [ ] **Step 5: Watch progress steps complete**

Expected: Steps 1–5 complete in sequence, then auto-redirect to `/assignments/[id]`.

- [ ] **Step 6: Verify exam paper output**

Expected: Formatted exam paper with school name, subject, student info lines, sections, questions with difficulty badges and marks.

- [ ] **Step 7: Test PDF download**

Click "Download PDF". Expected: PDF file downloads with properly formatted exam paper.

- [ ] **Step 8: Test Regenerate**

Click "Regenerate". Expected: Redirected back to generating page, new paper generated.

- [ ] **Step 9: Return to dashboard**

Expected: Assignment card shows in list with "completed" status.

---

### Task 22: Deploy to Vercel + Railway

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Deploy backend to Railway**

1. Go to railway.app → New Project → Deploy from GitHub repo
2. Select the repo, set root directory to `backend/`
3. Add services: MongoDB plugin, Redis plugin
4. Add environment variables from `backend/.env.example`
5. Set `MONGODB_URI` and `REDIS_URL` from Railway's auto-generated plugin URLs
6. Set `FRONTEND_URL` to your Vercel URL (update after step 3)
7. Deploy — note the Railway backend URL

- [ ] **Step 3: Deploy frontend to Vercel**

1. Go to vercel.com → New Project → Import GitHub repo
2. Set root directory to `frontend/`
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = Railway backend URL
   - `NEXT_PUBLIC_SOCKET_URL` = Railway backend URL
4. Deploy

- [ ] **Step 4: Update Railway FRONTEND_URL**

Go back to Railway → backend service → Environment Variables → update `FRONTEND_URL` to Vercel deployment URL → redeploy.

- [ ] **Step 5: Smoke test production**

Open the Vercel URL, create an assignment, verify end-to-end flow works in production.

- [ ] **Step 6: Add deployment URLs to README.md**

```markdown
## Live Demo

- Frontend: https://your-app.vercel.app
- Backend: https://your-api.up.railway.app
```

```bash
git add README.md
git commit -m "docs: add deployment URLs to README"
git push origin main
```

---

### Task 23: Final README

- [ ] **Step 1: Update root README.md**

```markdown
# VedaAI Assessment Creator

AI-powered assignment and question paper generator for teachers.

## Live Demo

- App: https://your-app.vercel.app

## Architecture

Monorepo with Next.js 14 frontend (Vercel) and Express backend (Railway).

The teacher fills a form → backend creates a MongoDB record and enqueues a BullMQ job → a worker calls the Grok API to generate a structured JSON question paper → Zod validates the response → result saved to MongoDB → Socket.IO notifies the frontend → exam paper rendered.

```
vedaai-assessment-creator/
├── frontend/     # Next.js 14, Tailwind, Zustand, React Hook Form
└── backend/      # Express, MongoDB, Redis, BullMQ, Socket.IO, Grok API
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand |
| Forms | React Hook Form + Zod |
| Realtime | Socket.IO |
| PDF | @react-pdf/renderer |
| Backend | Express, TypeScript |
| Database | MongoDB (Mongoose) |
| Queue | BullMQ + Redis |
| AI | Grok API (xAI, OpenAI-compatible) |
| Deploy | Vercel + Railway |

## Local Setup

### Prerequisites
- Node.js 18+
- Docker (for MongoDB + Redis) or local installs

### Backend
```bash
cd backend
cp .env.example .env   # fill in your GROK_API_KEY
docker run -d -p 27017:27017 mongo:7
docker run -d -p 6379:6379 redis:7
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local   # or create with NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```

Open http://localhost:3000
```

```bash
git add README.md
git commit -m "docs: finalize README with architecture and setup instructions"
git push origin main
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by task |
|---|---|
| Dashboard empty state | Task 16 |
| Dashboard filled state (assignment cards) | Task 16 |
| Sidebar desktop nav | Task 15 |
| Bottom nav mobile | Task 15 |
| Create assignment form | Task 17 |
| File upload UI (no parsing) | Task 17 (UploadBox) |
| Due date field | Task 17 |
| Dynamic question type rows | Task 17 (QuestionTypeRow) |
| Total marks/questions live calculation | Task 17 |
| Form validation (Zod + RHF) | Tasks 12, 17 |
| Zustand state management | Task 14 |
| POST /api/assignments | Task 9 |
| GET /api/assignments | Task 9 |
| GET /api/assignments/:id | Task 9 |
| POST /api/assignments/:id/regenerate | Task 9 |
| MongoDB models | Task 4 |
| Zod validators (backend) | Task 5 |
| BullMQ queue + worker | Tasks 7 |
| Grok API integration | Task 6 |
| Prompt structured for JSON output | Task 6 |
| Socket.IO server (rooms) | Task 8 |
| Redis status cache | Task 9 (listAssignments) |
| WebSocket progress steps | Tasks 18 |
| assignment-completed event | Task 7 |
| assignment-failed + recovery | Tasks 7, 18 |
| Exam paper output page | Task 19 |
| Difficulty badges | Task 19 |
| Student info section | Task 19 (ExamPaper) |
| Sections with instructions | Task 19 (QuestionSection) |
| PDF export (@react-pdf/renderer) | Task 20 |
| Regenerate button | Task 19 |
| Mobile responsive | Tasks 15–19 (Tailwind breakpoints) |
| Vercel + Railway deployment | Task 22 |
| README with setup instructions | Tasks 10, 11, 23 |

All spec requirements covered. No gaps found.
