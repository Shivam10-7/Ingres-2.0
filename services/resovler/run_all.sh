#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---- START FASTAPI ----
cd "$SCRIPT_DIR/services/resovler" || exit

if [ -f "myvenv/bin/activate" ]; then
    source "myvenv/bin/activate"
else
    echo "ERROR: venv not found"
    exit 1
fi

echo "Starting FastAPI..."
uvicorn api:app --reload --port 8000 &

# ---- START NODE SERVER ----
cd "$SCRIPT_DIR/server" || exit

echo "Starting Node server..."
node node.js &

# ---- START FRONTEND ----
cd "$SCRIPT_DIR/client/ingress-ai-landing" || exit

echo "Starting frontend..."
npm run dev &

# ---- WAIT ----
echo "All services started."
wait