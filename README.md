# TODO App

A full-stack TODO application with React (Vite) frontend and FastAPI backend.

## Tech Stack
- Frontend: React + Vite
- Backend: FastAPI
- Database: SQLite / PostgreSQL local setup

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
uvicorn main:app --reload
```

## One-Click Desktop Launch
This project includes desktop launcher scripts under `desktop/`.

If needed, regenerate the desktop shortcut:
```powershell
powershell -ExecutionPolicy Bypass -File .\desktop\create-shortcut.ps1
```

## Logo Guide
The app logo file is expected at:
- `frontend/public/TO-DO.png`

This logo is used in:
- Browser favicon and app title bar icon
- In-app header logo
- Desktop shortcut icon (converted to `.ico` automatically)

### Change Logo
1. Replace `frontend/public/TO-DO.png` with your new PNG.
2. Rebuild frontend if needed:
```bash
cd frontend
npm run build
```
3. Regenerate desktop shortcut icon:
```powershell
powershell -ExecutionPolicy Bypass -File .\desktop\create-shortcut.ps1
```

## License
This project is licensed under the MIT License. See `LICENSE`.

## Contributing
Please read `CONTRIBUTING.md` before opening a PR.
