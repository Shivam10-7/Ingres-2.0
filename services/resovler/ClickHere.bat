@echo off
set ROOT=E:\_\C++ project\SIH Prototype\Ingres-2.0

echo Starting all services...

:: --- Terminal 1: Frontend ---
start "Frontend - ingress-ai-landing" powershell -NoExit -Command ^
"cd '%ROOT%\client\ingress-ai-landing'; npm run dev"

:: --- Terminal 2: Server ---
start "Backend - Node Server" powershell -NoExit -Command ^
"cd '%ROOT%\server'; node node.js"

:: --- Terminal 3: Python Service ---
start "Resolver - FastAPI" powershell -NoExit -Command ^
"cd '%ROOT%\services\resovler'; .\myvenv\Scripts\Activate.ps1; uvicorn api:app --reload --port 8000"

echo All terminals launched.