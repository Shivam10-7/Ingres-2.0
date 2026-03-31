#It's live 🎉🎊✨🖥️😁
```postman
https://ingres-2-0.onrender.com/resolve-entity
```
```testpayload
{
  "query": "list over exploited districts in pune with lowest recharge",
  "session_id": "1222221"
}
```


# Entity Resolver API — Setup Guide

> **Stack:** Python 3.x · FastAPI · Uvicorn · rapidfuzz · sentence-transformers (optional)
> **Base path used in this guide:** `E:\_\C++ project\SIH Prototype\Ingres-2.0\services\resovler`
> Substitute your actual path where needed.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Create the Virtual Environment](#2-create-the-virtual-environment)
3. [Install Dependencies](#3-install-dependencies)
4. [Configure Intent Backend](#4-configure-intent-backend)
5. [Start the API Server](#5-start-the-api-server)
6. [Verify the Server is Running](#6-verify-the-server-is-running)
7. [Test Routes](#7-test-routes)
8. [Sample Queries and Responses](#8-sample-queries-and-responses)
9. [Stopping and Restarting](#9-stopping-and-restarting)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

Before starting, confirm the following are installed on your machine.

| Tool | Minimum version | Check command |
|---|---|---|
| Python | 3.9+ | `python --version` |
| pip | 21+ | `pip --version` |
| Node.js (frontend only) | 16+ | `node --version` |

> **Windows users:** All commands below are written for **PowerShell**.
> Right-click the Start menu → *Windows PowerShell* to open one.

---

## 2. Create the Virtual Environment

Navigate to the resolver folder first. Every command in this guide assumes you are inside it.

```powershell
cd "E:\_\C++ project\SIH Prototype\Ingres-2.0\services\resovler"
```

Create the virtual environment:

```powershell
python -m venv myvenv
```

Activate it:

```powershell
.\myvenv\Scripts\Activate.ps1
```

You will see `(myvenv)` appear at the start of your prompt when activation succeeds:

```
(myvenv) PS E:\_\...\resovler>
```

> **Execution policy error?** Run this once in PowerShell as Administrator, then retry:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

---

## 3. Install Dependencies

### 3a. Minimal install (resolver + API only, no neural model)

```powershell
pip install  -r requirement.txt
```

### 3b. Full install (includes neural intent backend)

```powershell
pip install fastapi uvicorn rapidfuzz pydantic scikit-learn sentence-transformers torch
```

> `sentence-transformers` and `torch` add ~800 MB to disk.
> Skip them unless you intend to set `USE_NEURAL=true` (see Section 4).

### 3c. Install from the repo requirements file

If your project has `services/requirements.txt`, you can install everything at once.
Run this from the `Ingres-2.0` root folder (one level above `services`):

```powershell
cd "E:\_\C++ project\SIH Prototype\Ingres-2.0"
pip install -r services\requirements.txt
```

Then navigate back:

```powershell
cd services\resovler
```

### Verify the install

```powershell
python -c "import fastapi, uvicorn, rapidfuzz, sklearn; print('All core deps OK')"
```

Expected output:

```
All core deps OK
```

---

## 4. Configure Intent Backend

The intent extractor supports two backends controlled by an environment variable.

| Value | Backend | When to use |
|---|---|---|
| `false` (default) | TF-IDF (scikit-learn) | Development, low-resource machines |
| `true` | Neural — `all-MiniLM-L6-v2` | Production, when paraphrase matching is needed |

### Set the variable for this session (PowerShell)

**TF-IDF (default, no extra setup needed):**

```powershell
$env:USE_NEURAL = "false"
```

**Neural model:**

```powershell
$env:USE_NEURAL = "true"
```

> When `USE_NEURAL=true` is set for the first time, `sentence-transformers` will
> download the model (~90 MB) automatically on first startup. Subsequent starts use
> the cached version.

---

## 5. Start the API Server

Make sure you are still inside the `resovler` folder with `myvenv` active, then run:

```powershell
uvicorn api:app --reload --port 8000
```

| Flag | Purpose |
|---|---|
| `api:app` | loads the `app` object from `api.py` |
| `--reload` | restarts automatically when any `.py` file changes |
| `--port 8000` | binds to port 8000 |

### Expected startup output

```
INFO:     Will watch for changes in these directories: ['...\\resovler']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXX] using WatchFiles
INFO:     Started server process [XXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

> **`db.json` not found error?** You started uvicorn from the wrong directory.
> `api.py` resolves `db.json` relative to your *current working directory*, not
> the script location. Always `cd` into `resovler` before running uvicorn.

---

## 6. Verify the Server is Running

Open a **new** PowerShell window (keep the server running in the first one).

### Health check — PowerShell

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/"
```

### Health check — browser

Open: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

### Expected response

```json
{
  "message": "Entity Resolver API Running "
}
```

### Interactive API docs (built into FastAPI)

Open: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

This gives you a full Swagger UI where you can test every endpoint in the browser
without writing any code.

---

## 7. Test Routes

All requests go to `POST /resolve-entity`.
The body always requires two fields:

| Field | Type | Description |
|---|---|---|
| `query` | string | The natural-language query |
| `session_id` | string | Any string — used for frontend tracking, ignored by resolver |

---

### Route 1 — Simple state query

**PowerShell:**

```powershell
$body = @{ query = "Maharashtra"; session_id = "test-01" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/resolve-entity" `
                  -Method Post `
                  -ContentType "application/json" `
                  -Body $body
```

**curl:**

```bash
curl -X POST http://127.0.0.1:8000/resolve-entity \
     -H "Content-Type: application/json" \
     -d '{"query": "Maharashtra", "session_id": "test-01"}'
```

**Expected response:**

```json
{
  "status": "resolved",
  "entities": [
    { "type": "state", "state": "Maharashtra" }
  ],
  "intents": [],
  "intent_status": "not_found",
  "description": "Resolved 1 location(s) from your query."
}
```

---

### Route 2 — District with explicit type keyword

**PowerShell:**

```powershell
$body = @{ query = "Nagpur district"; session_id = "test-02" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/resolve-entity" `
                  -Method Post `
                  -ContentType "application/json" `
                  -Body $body
```

**curl:**

```bash
curl -X POST http://127.0.0.1:8000/resolve-entity \
     -H "Content-Type: application/json" \
     -d '{"query": "Nagpur district", "session_id": "test-02"}'
```

**Expected response:**

```json
{
  "status": "resolved",
  "entities": [
    { "type": "district", "district": "Nagpur", "state": "Maharashtra" }
  ],
  "intents": [],
  "intent_status": "not_found",
  "description": "Resolved 1 location(s) from your query."
}
```

---

### Route 3 — Query with intent (comparison)

**PowerShell:**

```powershell
$body = @{ query = "compare groundwater extraction in Nagpur and Pune district"; session_id = "test-03" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/resolve-entity" `
                  -Method Post `
                  -ContentType "application/json" `
                  -Body $body
```

**curl:**

```bash
curl -X POST http://127.0.0.1:8000/resolve-entity \
     -H "Content-Type: application/json" \
     -d '{"query": "compare groundwater extraction in Nagpur and Pune district", "session_id": "test-03"}'
```

**Expected response:**

```json
{
  "status": "resolved",
  "entities": [
    { "type": "district", "district": "Nagpur", "state": "Maharashtra" },
    { "type": "district", "district": "Pune",   "state": "Maharashtra" }
  ],
  "intents": ["comparison", "extraction"],
  "intent_status": "ambiguous",
  "description": "Resolved 2 location(s) from your query."
}
```

---

### Route 4 — Ambiguous name (same name in multiple states)

**PowerShell:**

```powershell
$body = @{ query = "Aurangabad district"; session_id = "test-04" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/resolve-entity" `
                  -Method Post `
                  -ContentType "application/json" `
                  -Body $body
```

**curl:**

```bash
curl -X POST http://127.0.0.1:8000/resolve-entity \
     -H "Content-Type: application/json" \
     -d '{"query": "Aurangabad district", "session_id": "test-04"}'
```

**Expected response:**

```json
{
  "status": "ambiguous",
  "message": "Multiple matches found. Please clarify which location you mean.",
  "options": [
    { "type": "district", "district": "Aurangabad", "state": "Maharashtra" },
    { "type": "district", "district": "Aurangabad", "state": "Bihar"       }
  ],
  "intents": [],
  "intent_status": "not_found",
  "description": "Your query matches more than one possible location."
}
```

---

### Route 5 — Misspelled location (fuzzy suggest)

**PowerShell:**

```powershell
$body = @{ query = "Nagpurr district"; session_id = "test-05" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/resolve-entity" `
                  -Method Post `
                  -ContentType "application/json" `
                  -Body $body
```

**curl:**

```bash
curl -X POST http://127.0.0.1:8000/resolve-entity \
     -H "Content-Type: application/json" \
     -d '{"query": "Nagpurr district", "session_id": "test-05"}'
```

**Expected response:**

```json
{
  "status": "suggest",
  "message": "Did you mean one of these?",
  "options": [
    { "type": "district", "district": "Nagpur", "state": "Maharashtra" }
  ],
  "intents": [],
  "intent_status": "not_found",
  "description": "No exact match found, but these look close to what you typed."
}
```

---

### Route 6 — Completely unknown location

**PowerShell:**

```powershell
$body = @{ query = "Zorgabad district"; session_id = "test-06" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/resolve-entity" `
                  -Method Post `
                  -ContentType "application/json" `
                  -Body $body
```

**curl:**

```bash
curl -X POST http://127.0.0.1:8000/resolve-entity \
     -H "Content-Type: application/json" \
     -d '{"query": "Zorgabad district", "session_id": "test-06"}'
```

**Expected response:**

```json
{
  "status": "not_found",
  "message": "Could not find any matching location. Please clarify.",
  "intents": [],
  "intent_status": "not_found"
}
```

---

## 8. Sample Queries and Responses

The table below shows a wide range of real-world queries and what the resolver returns for each.

### Location resolution

| Query | `status` | What was resolved |
|---|---|---|
| `"Maharashtra"` | `resolved` | state |
| `"districts in Punjab"` | `resolved` | state (Punjab) — district listing is handled by downstream logic |
| `"Nagpur district"` | `resolved` | district, Maharashtra |
| `"CAR NICOBAR block in ANDAMAN AND NICOBAR ISLANDS"` | `resolved` | block + state |
| `"NICOBAR district"` | `resolved` | district, Andaman and Nicobar Islands |
| `"ANDAMAN AND NICOBAR ISLANDS"` | `resolved` | state |
| `"Aurangabad district"` | `ambiguous` | same district name in multiple states |
| `"Nagpurr district"` | `suggest` | fuzzy match → Nagpur |
| `"Zorgabad district"` | `not_found` | no match |

---

### Intent detection

| Query | `intents` | `intent_status` |
|---|---|---|
| `"compare extraction in Nagpur and Pune"` | `["comparison", "extraction"]` | `ambiguous` |
| `"show me the trend in groundwater levels in Maharashtra"` | `["trend"]` | `resolved` |
| `"which district has the highest recharge in Rajasthan"` | `["highest", "recharge"]` | `ambiguous` |
| `"forecast for groundwater in Punjab"` | `["forecast"]` | `resolved` |
| `"is Nagpur district overexploited"` | `["status_overexploited"]` | `resolved` |
| `"rank all districts by extraction in UP"` | `["ranking", "extraction"]` | `ambiguous` |
| `"tell me about Kota"` | `[]` | `not_found` |

---

### Combined location + intent (full resolved responses)

**Query:** `"show groundwater trend in Jaipur district over the years"`

```json
{
  "status":        "resolved",
  "entities":      [{ "type": "district", "district": "Jaipur", "state": "Rajasthan" }],
  "intents":       ["trend"],
  "intent_status": "resolved",
  "description":   "Resolved 1 location(s) from your query."
}
```

---

**Query:** `"compare recharge and extraction in Pune and Nashik district"`

```json
{
  "status":        "resolved",
  "entities": [
    { "type": "district", "district": "Pune",   "state": "Maharashtra" },
    { "type": "district", "district": "Nashik", "state": "Maharashtra" }
  ],
  "intents":       ["comparison", "recharge", "extraction"],
  "intent_status": "ambiguous",
  "description":   "Resolved 2 location(s) from your query."
}
```

---

**Query:** `"which blocks in Nagpur district are overexploited"`

```json
{
  "status":        "resolved",
  "entities":      [{ "type": "district", "district": "Nagpur", "state": "Maharashtra" }],
  "intents":       ["status_overexploited"],
  "intent_status": "resolved",
  "description":   "Resolved 1 location(s) from your query."
}
```

---

**Query:** `"Nicoboar district"` (misspelling)

```json
{
  "status":        "suggest",
  "message":       "Did you mean one of these?",
  "options":       [{ "type": "district", "district": "Nicobar", "state": "Andaman and Nicobar Islands" }],
  "intents":       [],
  "intent_status": "not_found",
  "description":   "No exact match found, but these look close to what you typed."
}
```

---

## 9. Stopping and Restarting

### Stop the server

Press `CTRL + C` in the terminal where uvicorn is running.

### Restart after a code change

With `--reload` active, the server restarts automatically when any `.py` file is saved.
No manual restart needed during development.

### Restart manually

```powershell
# Stop with CTRL+C, then run again:
uvicorn api:app --reload --port 8000
```

### Deactivate the virtual environment

```powershell
deactivate
```

---

## 10. Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| `FileNotFoundError: db.json` | Wrong working directory | `cd` into `services\resovler` before running uvicorn |
| `ModuleNotFoundError: fastapi` | venv not active or deps not installed | Activate `myvenv`, then `pip install fastapi uvicorn rapidfuzz pydantic` |
| `ModuleNotFoundError: sentence_transformers` | Neural deps not installed | Run `pip install sentence-transformers torch` or set `USE_NEURAL=false` |
| `cannot be loaded because running scripts is disabled` | PowerShell execution policy | Run `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` as Admin |
| Port 8000 already in use | Another process on port 8000 | Change port: `uvicorn api:app --reload --port 8001` |
| `422 Unprocessable Entity` from API | Missing `session_id` in request body | Always send both `query` and `session_id` in the JSON body |
| Server starts but `/resolve-entity` returns `500` | `intent_db.json` missing | Confirm `intent_db.json` is in the `resovler` folder alongside `db.json` |
| Slow first startup with `USE_NEURAL=true` | Model downloading for first time (~90 MB) | Wait — subsequent starts use the cached model |
