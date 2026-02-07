# Copilot Instructions — Ingres-2.0

> Quick reference for AI coding agents working on this repository (concise, actionable). ⭐️

## Project snapshot
- Minimal Node/Express service that powers the Ingres chatbot: primary server entry is `server/node.js` (uses `express`, `dotenv`).
- Repo contains a `docs/Architecture.png` (visual architecture) and `server/src` for route/middleware pipelines.
- Key pipeline notes are in `server/src/routes/middleware/pipelines/db/mayank.md` (query validator/executor guidance).

---

## How to run locally (explicit commands)
- Install: run `npm install` inside `server/` (project-level `package.json` is in `server/`).
- Start (one-off): `node server/node.js` or `cd server && node node.js`.
- Live reload: repo includes `nodemon` as a dependency; use `npx nodemon node.js` from `server/`.
- Environment: repo uses `dotenv` and includes `.env` (`PORT = 8081`). Note: the server currently listens on a hardcoded port (8081) — it does not read `process.env.PORT` yet.

---

## Architecture & design notes (what to know)
- Single lightweight HTTP service implemented with Express (server is intentionally small/simple).
- Routing/middleware structure lives under `server/src/routes`. Middleware pipelines (including DB-related middleware) are under `server/src/routes/middleware/pipelines/`.
- DB-related responsibilities are documented in `server/src/routes/middleware/pipelines/db/mayank.md`:
  - Implement a safe SQL query executor and validator that forbids destructive commands (DROP/DELETE/ALTER).
  - Normalize large result sets to a maximum of ~10 rows before responding.
- The `docs/Architecture.png` should be consulted for service boundaries and high-level flow when implementing changes that affect integrations.

---

## Project-specific patterns & conventions
- Small, explicit server file: expect logic to be centralized in `server/node.js` and middleware under `server/src` rather than a deep microservice layout.
- DB safety-first: follow the instructions in `mayank.md` when touching DB query code (validate queries, limit rows returned).
- Environment usage: `dotenv` is used but the code base still contains direct values (e.g., port). When adding features, prefer reading from `process.env` but be mindful that tests / CI may assume defaults.

---

## Tests, CI, and quality
- There are no tests or CI workflows present (`server/package.json` contains only a placeholder `test` script).
- If adding features, include unit tests and a CI workflow (`.github/workflows`) to run `npm test` and linting.

---

## Integration points & external deps
- Dependencies: `express`, `dotenv`, `nodemon` (see `server/package.json`).
- No external DB client or API integrations are committed yet — DB integration notes live in the `pipelines/db` markdown.
- No containerization or cloud deployment manifests present in repo (no Dockerfile, no k8s manifests).

---

## Example tasks an agent can do safely
- Add a `start` and `dev` script in `server/package.json` (examples: `"start":"node node.js"`, `"dev":"nodemon node.js"`).
- Make the server respect `PORT` (`const port = process.env.PORT || 8081; app.listen(port)`), and add a short test that the server responds at `/`.
- Implement DB query validator/executor per `mayank.md`, and add tests that ensure forbidden SQL commands are rejected.

---

## Where to look for clarification
- High-level visuals: `docs/Architecture.png`.
- DB/validation notes: `server/src/routes/middleware/pipelines/db/mayank.md`.
- Run & dependency info: `server/package.json`, `server/node.js`, and `.env`.

---

If anything above is unclear or you want the instructions to emphasize a different area (testing, CI, or a particular file), tell me which part to expand and I will iterate. ✅