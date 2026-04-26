# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Development Commands

### Backend (Express server)
- **Install dependencies**: `cd server && npm install`
- **Run locally**: `npm start` (starts the API on the port defined by `process.env.PORT` or `8081`)
- **Health check**: `curl -s http://localhost:8081/` returns `{ status: "ok", service: "ingres-server" }`
- **Neon/Postgres probe**: `curl -s http://localhost:8081/health/neon`
- **Run tests**: `npm test` (placeholder – currently prints a message)
- **Lint (if added later)**: `npm run lint`

### Frontend (React + Vite)
- **Install dependencies**: `cd client/ingress-ai-landing && npm install`
- **Start dev server**: `npm run dev` (Vite dev server, typically http://localhost:5173)
- **Build for production**: `npm run build`
- **Preview built app**: `npm run preview`
- **Run lint**: `npm run lint`
- **Run tests**: `npm run test` (Vitest)
- **Run a single test**: `npm run test -- <test-file-or-pattern>`

## High‑Level Architecture

- **Backend** (`server/`)
  - **Express API** (`server/node.js`) handling routes for auth, chat, GWRA data, and health endpoints.
  - **Authentication** in `server/src/routes/middleware/auth.js` using JWT cookies (httpOnly) and optional Bearer token support.
  - **Chat flow**: `POST /chat` → `classifier` → pipeline (data query, detailed response, visualisation) → MongoDB (`Chat` model) for history.
  - **Database layer**:
    - MongoDB for user & chat persistence (`mongoose`).
    - Neon/Postgres (via `pg` pool) for groundwater data (`server/src/routes/db/dataRetrive.js`).
    - Legacy MySQL code retained but disabled.
  - **Modular pipelines** (`server/src/routes/pipelines/`) for data query, detailed response, and visualisation, each returning a JSON structure consumed by the frontend.
  - **CORS** configured from `ALLOWED_ORIGINS` env variable plus a default list.

- **Frontend** (`client/ingress-ai-landing/`)
  - Built with React, TypeScript, Vite, and Tailwind CSS.
  - UI components under `src/components/` and pages under `src/pages/`.
  - **API client** in `src/lib/api.ts` reads `VITE_API_BASE_URL` (default `http://localhost:8081`).
  - Auth flow uses the `/auth` endpoints; cookies work locally, but for cross‑origin production you should send the `Authorization: Bearer <token>` header as described in the docs.
  - Protected routes (`ProtectedRoute`) guard the chat UI.
  - Charts are rendered with `echarts` and custom payload generators (`src/lib/chart.ts`).

- **Docs & Integration** (`docs/frontend-backend-integration.md`)
  - Lists hard‑coded URLs that need replacement with the deployed base URL.
  - Shows example `curl` commands for the API.
  - Explains CORS and cookie vs token handling.

## Important Files & Locations
| Area | Path | Purpose |
|------|------|---------|
|Server entry | `server/node.js` | Express app, route registration, DB init |
|Auth routes | `server/src/routes/middleware/auth.js` | Login, signup, JWT cookie handling |
|Chat routes | `server/src/routes/chatRoutes.js` | CRUD for chat history |
|Classifier & pipelines | `server/src/routes/classifier.js` and `server/src/routes/pipelines/` | Route selection logic for data query, detailed response, visualisation |
|Mongo models | `server/src/routes/middleware/models/Chat.js` & `User.js` | Persist chat history & users |
|DB connector | `server/src/routes/db/dataRetrive.js` | Neon/Postgres query helper |
|Frontend API base | `client/ingress-ai-landing/src/lib/api.ts` | Reads `VITE_API_BASE_URL` env variable |
|Frontend entry | `client/ingress-ai-landing/src/main.tsx` | Boots React app |
|Vite config | `client/ingress-ai-landing/vite.config.ts` | Build settings |
|Integration guide | `docs/frontend-backend-integration.md` | Hard‑coded URLs, CORS notes |
|Architecture diagram | `docs/Architecture.png` | Visual overview (see file) |

## Environment Variables
- **Backend** (`.env` / environment):
  - `MONGO_URI` – MongoDB connection string.
  - `DATABASE_URL` – Neon/Postgres connection string.
  - `JWT_SECRET` – secret for signing JWTs.
  - `ALLOWED_ORIGINS` – comma‑separated list for CORS.
  - `PORT` – server listen port (default 8081).
- **Frontend** (`.env` for Vite):
  - `VITE_API_BASE_URL` – base URL of the backend API (default `http://localhost:8081`).

## Common Gotchas
- **Auth cookie** works only when the frontend origin matches the backend or when `sameSite: "None"` and `secure: true` are set in production. For cross‑origin deployments use the `token` returned by login and send it as `Authorization: Bearer <token>`.
- **Hard‑coded URLs** – replace all occurrences listed in the integration guide with `VITE_API_BASE_URL`.
- **CORS** – ensure the frontend origin is added to `ALLOWED_ORIGINS` on the server, otherwise requests will be blocked.
- **Database migrations** – the old MySQL block is kept for reference but disabled; Neon/Postgres is the active DB.
- **Port conflicts** – the server defaults to 8081; Vite dev server defaults to 5173. Adjust `PORT` or `VITE_API_BASE_URL` accordingly.

## Where to Find Documentation
- High‑level architecture diagram: `docs/Architecture.png`
- Backend API contract: see route definitions in `server/src/routes/`.
- Frontend component library: `src/components/` and `src/pages/`.
- Integration steps and hard‑coded URL list: `docs/frontend-backend-integration.md`

---
*Generated by Claude Code*