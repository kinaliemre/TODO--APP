@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"
set "PG_BIN=C:\Program Files\PostgreSQL\18\bin"
set "PGDATA=%BACKEND_DIR%\pgdata"
set "PGLOG=%BACKEND_DIR%\postgres.log"
set "FRONTEND_URL=http://localhost:5173"

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

call :is_port_open 8000
if errorlevel 1 (
  echo Backend baslatiliyor...
  powershell -NoProfile -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d ""%BACKEND_DIR%"" && call .venv\Scripts\activate.bat && uvicorn main:app --reload' -WindowStyle Hidden"
) else (
  echo Backend zaten calisiyor.
)

call :is_port_open 5173
if errorlevel 1 (
  echo Frontend baslatiliyor...
  powershell -NoProfile -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d ""%FRONTEND_DIR%"" && npm.cmd run dev' -WindowStyle Hidden"
) else (
  echo Frontend zaten calisiyor.
)

set /a WAIT_COUNT=0
:wait_frontend
call :is_port_open 5173
if not errorlevel 1 goto open_browser
set /a WAIT_COUNT+=1
if %WAIT_COUNT% GEQ 25 goto open_browser
timeout /t 1 /nobreak >nul
goto wait_frontend

:open_browser
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "%FRONTEND_URL%"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "%FRONTEND_URL%"
) else (
  start "" "%FRONTEND_URL%"
)

echo Tamam. Frontend sayfasi acildi: %FRONTEND_URL%
endlocal
exit /b 0

:is_port_open
powershell -NoProfile -Command "$ok=(Get-NetTCPConnection -LocalPort %~1 -State Listen -ErrorAction SilentlyContinue); if ($ok) { exit 0 } else { exit 1 }"
exit /b %errorlevel%
