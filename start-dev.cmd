@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"
set "PG_BIN=C:\Program Files\PostgreSQL\18\bin"
set "PGDATA=%BACKEND_DIR%\pgdata"
set "PGLOG=%BACKEND_DIR%\postgres.log"

if not exist "%BACKEND_DIR%\.venv\Scripts\python.exe" (
  echo [HATA] backend sanal ortami bulunamadi: %BACKEND_DIR%\.venv
  exit /b 1
)

if not exist "%PG_BIN%\pg_isready.exe" (
  echo [HATA] PostgreSQL bin klasoru bulunamadi: %PG_BIN%
  exit /b 1
)

if not exist "%PGDATA%\PG_VERSION" (
  echo [HATA] PostgreSQL data klasoru bulunamadi: %PGDATA%
  echo Once initdb ile olusturulmasi gerekiyor.
  exit /b 1
)

"%PG_BIN%\pg_isready.exe" -h localhost -p 5432 >nul 2>&1
if errorlevel 1 (
  echo PostgreSQL baslatiliyor...
  "%PG_BIN%\pg_ctl.exe" -D "%PGDATA%" -l "%PGLOG%" start
)

echo Backend ve frontend aciliyor...
start "todo-backend" cmd /k "cd /d \"%BACKEND_DIR%\" && .venv\Scripts\activate.bat && uvicorn main:app --reload"
start "todo-frontend" cmd /k "cd /d \"%FRONTEND_DIR%\" && npm run dev"

echo Tamam. Iki ayri terminal acildi.
endlocal

