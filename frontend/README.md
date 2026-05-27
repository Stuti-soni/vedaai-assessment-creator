# VedaAI Frontend

Next.js 14 App Router frontend for the VedaAI Assessment Creator.

## Setup

1. Create `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000
   NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
   ```
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

Open http://localhost:3000

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — assignment list or empty state |
| `/assignments/new` | Create assignment form |
| `/assignments/[id]/generating` | Real-time generation progress |
| `/assignments/[id]` | Generated exam paper + PDF download |

## Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS v4
- Zustand (state management)
- React Hook Form + Zod (form validation)
- Socket.IO client (real-time updates)
- @react-pdf/renderer (PDF export)
- Axios (HTTP client)
