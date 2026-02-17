# Repository Guidelines

## Project Structure & Module Organization
- `frontend/`: React + Vite client app.
- `frontend/src/`: UI source (`App.jsx`, `main.jsx`, styles in `App.css` and `index.css`).
- `frontend/public/`: static assets served directly.
- `backend/main.py`: FastAPI API (tasks CRUD + CORS setup).
- Keep feature logic close to where it is used; split large React components into `frontend/src/components/` when they grow.

## Build, Test, and Development Commands
- Frontend setup: `cd frontend && npm install`
- Frontend dev server: `npm run dev` (Vite HMR local development).
- Frontend production build: `npm run build` (outputs to `frontend/dist/`).
- Frontend preview: `npm run preview` (serves built app locally).
- Lint frontend: `npm run lint` (ESLint flat config).
- Backend dev server: `cd backend && uvicorn main:app --reload`

## Coding Style & Naming Conventions
- JavaScript/JSX: follow ESLint rules in `frontend/eslint.config.js`.
- Use 2-space indentation in frontend files; keep imports grouped (external first, local second).
- React components: `PascalCase` file and component names (e.g., `TaskList.jsx`).
- Variables/functions: `camelCase`; constants: `UPPER_SNAKE_CASE`.
- Python (backend): follow PEP 8 (4-space indentation, `snake_case` names, clear function names).

## Testing Guidelines
- No test framework is configured yet.
- When adding tests:
  - Frontend: prefer Vitest + React Testing Library under `frontend/src/__tests__/`.
  - Backend: prefer `pytest` with API tests under `backend/tests/`.
- Name tests by behavior (e.g., `task-toggle.test.jsx`, `test_update_task_404.py`).

## Commit & Pull Request Guidelines
- Use Conventional Commit style based on repo history: `feat: ...`.
- Recommended types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
- Keep commits focused and atomic; include scope when helpful (e.g., `fix(frontend): handle empty title`).
- PRs should include:
  - concise summary of changes,
  - linked issue/task ID,
  - screenshots or short GIFs for UI updates,
  - testing notes (what you ran and results).

## Security & Configuration Tips
- Do not commit secrets or `.env` files.
- Current CORS is permissive in `backend/main.py`; restrict `allow_origins` before production deployment.
