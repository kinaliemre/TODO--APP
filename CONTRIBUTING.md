# Contributing Guide

Thanks for contributing to TODO App.

## Development Setup

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

## Code Style
- Frontend: follow `frontend/eslint.config.js`
- JavaScript/JSX: 2-space indentation
- React components: PascalCase
- Variables/functions: camelCase
- Backend Python: PEP 8, snake_case

## Testing
No formal test suite is configured yet.

When adding tests:
- Frontend: Vitest + React Testing Library under `frontend/src/__tests__/`
- Backend: pytest under `backend/tests/`

## Commit Style
Use Conventional Commits:
- `feat: ...`
- `fix: ...`
- `refactor: ...`
- `docs: ...`
- `test: ...`
- `chore: ...`

Scope is recommended when useful, for example:
- `fix(frontend): handle empty title`

## Pull Request Checklist
- Add a clear summary of changes
- Link related issue/task
- Add screenshots/GIF for UI changes
- Include test notes (commands run + results)

## Logo-related Changes
If you change the logo:
1. Update `frontend/public/TO-DO.png`
2. Regenerate desktop shortcut icon:
```powershell
powershell -ExecutionPolicy Bypass -File .\desktop\create-shortcut.ps1
```
