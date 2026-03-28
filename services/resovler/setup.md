# Entity Resolver Module Setup (`services/resovler`)

This module provides an API that resolves **place entities** (India administrative locations) from a natural-language query.

It loads `db.json` (states -> districts -> assessmentUnits/blocks) and returns results as one of these statuses:

- `resolved`: extracted locations matched exactly
- `ambiguous`: multiple possible matches found (you must pick the correct option)
- `suggest`: close match suggestions for misspellings
- `not_found`: no matching location found

## Folder Contents

- `api.py`: FastAPI server exposing the resolver endpoint
- `resolver.py`: `EntityResolver` implementation (exact matching + fuzzy suggestions)
- `db.json`: location dataset used for resolution

## Prerequisites

You need Python 3.x installed.

This repo already has shared dependencies in:

- `services/requirements.txt`

## Create Virtual Environment (`myvenv`) (Windows / PowerShell)

Run these commands from the `services/resovler` folder:

```powershell
cd "d:\My_Project_Folder\Final_Year_project\INGRES2.0\Ingres-2.0\services\resovler"

python -m venv myvenv
.\myvenv\Scripts\Activate.ps1
```

When you are done, close the terminal or run:

```powershell
deactivate
```

## Install Dependencies

### Minimal install (recommended for this resolver)

This module only needs FastAPI + Uvicorn + fuzzy matching libraries:

```powershell
pip install fastapi uvicorn fuzzywuzzy rapidfuzz
```

### Install from repo requirements (full stack)

If you want to install everything the repo uses:

Run this from the `Ingres-2.0` folder (the one containing `services/requirements.txt`):

```powershell
# (Ensure `myvenv` is activated before running this)
pip install -r services\requirements.txt
```

## Run the Resolver API (FastAPI)

Important: `api.py` constructs `EntityResolver("db.json")`, so `db.json` must be resolvable relative to the **current working directory**.

Run the server from the `services/resovler` directory:

```powershell
cd "d:\My_Project_Folder\Final_Year_project\INGRES2.0\Ingres-2.0\services\resovler"
uvicorn api:app --reload --port 8000
```

Server health check:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8001/"
```

Test in browser (shows the same JSON):

`http://127.0.0.1:8001/`

Note: this module does not serve an `index.html`; the root path (`/`) returns JSON via the FastAPI handler.

Expected response:

```json
{
  "message": "Entity Resolver API Running "
}
```

## API Endpoint

### `POST /resolve-entity`

Request body:

```json
{
  "query": "NICOBAR district",
  "session_id": "demo"
}
```

Response:

- On `resolved`: returns `entities` (list of resolved items)
- On `ambiguous`: returns `options` (list of possible matches)
- On `suggest`: returns `options` (close spelling matches)
- On `not_found`: returns an error message

#### Example call (PowerShell)

```powershell
$body = @{
  query = "NICOBAR district"
  session_id = "demo"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://127.0.0.1:8001/resolve-entity" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## How Matching Works (Quick Overview)

The resolver tries in order:

1. **Exact matching** (token-subsequence matching over all known names)
2. **Pattern-based mentions** like `"<name> district"`, `"<name> block"`, `"<name> state"`
3. **Fuzzy suggestions** when exact lookup fails (for misspellings)

## Sample Queries (These are based on your current `db.json`)

If you want to test the resolver directly (no API), run Python from `services/resovler`.

### Direct usage (Python)

```python
from resolver import EntityResolver

r = EntityResolver("db.json")

print(r.resolve("ANDAMAN AND NICOBAR ISLANDS"))
print(r.resolve("NICOBAR district"))
print(r.resolve("CAR NICOBAR block in ANDAMAN AND NICOBAR ISLANDS"))

# Misspelling example (should return status="suggest" or similar)
print(r.resolve("NICOBOAR district"))
```

### API queries (same ideas)

Use these with `POST /resolve-entity`:

- `ANDAMAN AND NICOBAR ISLANDS`
- `NICOBAR district`
- `CAR NICOBAR block in ANDAMAN AND NICOBAR ISLANDS`
- `NICOBOAR district` (misspelling -> likely `suggest`)

## Troubleshooting

1. **`db.json not found` / file not found**
   - You likely started `uvicorn` from the wrong folder.
   - Run from `services/resovler` (see “Run the Resolver API”).

2. **`ModuleNotFoundError` for dependencies (fastapi/uvicorn/etc.)**
   - Re-run `pip install -r services\requirements.txt`.

3. **Server starts but endpoint fails**
   - Check the FastAPI console logs.
   - Confirm you are sending JSON with both `query` and `session_id`.

## Notes for Integration

- `session_id` is currently kept for compatibility; the resolver endpoint does not use it directly.
- The agent layer elsewhere in the repo uses a different entity-resolver function, so this API is mainly for frontend/backend integration or standalone testing of place resolution.

db.json ──► entity_index.py ──► fuzzy_match.py ──► resolver.py ──► api.py
intent_db.json ──► intent_extractor.py ──────────────────┘