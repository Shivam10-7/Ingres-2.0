@echo off
setlocal

REM Change to the script directory and then to the resolver service folder.
pushd "%~dp0"
cd /d "%~dp0resovler"

REM Use the batch activate script (works from cmd). If using PowerShell, run the PowerShell activate script instead.
if exist ".\myvenv\Scripts\activate.bat" (
    call ".\myvenv\Scripts\activate.bat"
) else if exist ".\myvenv\Scripts\Activate.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "& '.\myvenv\Scripts\Activate.ps1'"
) else (
    echo ERROR: virtualenv activation script not found in %cd%\myvenv\Scripts
    popd
    pause
    exit /b 1
)

if exist ".\myvenv\Scripts\activate.bat" (
    call ".\myvenv\Scripts\activate.bat"
) else if exist ".\myvenv\Scripts\Activate.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "& '.\myvenv\Scripts\Activate.ps1'"
) else (
    echo ERROR: virtualenv activation script not found in %cd%\myvenv\Scripts
    popd
    pause
    exit /b 1
)

echo Starting FastAPI server...
uvicorn api:app --reload --port 8000

REM Restore original directory
popd
pause