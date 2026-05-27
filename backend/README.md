# VedaAI Backend

Express + TypeScript API server with BullMQ background jobs, Socket.IO, MongoDB, and Redis.

## Setup

1. Copy `.env.example` to `.env` and fill in values (especially `GROK_API_KEY`)
2. Start MongoDB and Redis:
   ```bash
   docker run -d -p 27017:27017 mongo:7
   docker run -d -p 6379:6379 redis:7
   ```
3. Install dependencies: `npm install`
4. Start dev server: `npm run dev`

## Environment Variables

See `.env.example` for all required variables.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/assignments | Create assignment + trigger generation |
| GET | /api/assignments | List all assignments (Redis cached) |
| GET | /api/assignments/:id | Get assignment with generated paper |
| POST | /api/assignments/:id/regenerate | Re-trigger generation |

## Architecture

- `src/controllers/` — Express route handlers
- `src/services/` — Business logic (assignment, AI, prompt)
- `src/workers/` — BullMQ generation worker
- `src/queues/` — BullMQ queue definitions
- `src/models/` — Mongoose schemas
- `src/websocket/` — Socket.IO server
- `src/lib/` — DB, Redis, Zod validators
