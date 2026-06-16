# AI Development Coach

AI-powered career development coaching app — React frontend + Go backend.

## Project structure

```
AI-Development-Coach/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Go + Gin API
├── infra/             # Docker & nginx
├── ai_development_coach.html   # Original prototype (reference)
├── docker-compose.yml
├── Makefile
└── .env.example
```

## Quick start

### 1. Backend (Go)

```bash
cd backend
cp ../.env.example ../.env
go mod tidy
go run ./cmd/server        # http://localhost:8080
```

Or from root:

```bash
make backend
```

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Or from root:

```bash
make install
make frontend
```

### 3. Docker (optional)

```bash
cp .env.example .env
docker compose up --build
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/static` | Static data (questions, options) |
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/sessions` | Create session |
| PATCH | `/api/v1/sessions/:id/onboarding` | Save onboarding |
| POST | `/api/v1/sessions/:id/strength` | Submit strength answers |
| POST | `/api/v1/sessions/:id/strength/quick` | Submit quick strength discovery |
| GET | `/api/v1/sessions/:id/strength` | Get strength profile |
| POST | `/api/v1/admin/frameworks/upload` | Upload competency framework (`json`/`csv`) |
| GET | `/api/v1/frameworks` | List uploaded frameworks |
| POST | `/api/v1/sessions/:id/coach/start` | Start coaching |
| POST | `/api/v1/sessions/:id/coach/message` | Send coaching message |
| POST | `/api/v1/sessions/:id/coach/guided` | Submit guided selections |
| POST | `/api/v1/sessions/:id/analysis` | Run gap analysis |
| POST | `/api/v1/sessions/:id/commit` | Commit behaviors |
| POST | `/api/v1/sessions/:id/followup/start` | Start follow-up |
| POST | `/api/v1/sessions/:id/followup/message` | Send follow-up message |

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `free` | `free` or `anthropic` |
| `ANTHROPIC_API_KEY` | — | Optional, only when `AI_PROVIDER=anthropic` |
| `CLAUDE_MODEL` | `claude-sonnet-4-6` | Claude model |
| `DB_PATH` | `data/app.db` | SQLite database path |
| `PORT` | `8080` | Backend port |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | CORS origins |

## Sample Framework Upload

Sample files:

- `examples/competency_framework.sample.json`
- `examples/competency_framework.sample.csv`

Upload JSON:

```bash
curl -X POST http://localhost:8080/api/v1/admin/frameworks/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@examples/competency_framework.sample.json" \
  -F "format=json"
```

## Note on `go mod`

Go module lives in `backend/`, not the project root. Always run Go commands from `backend/`:

```bash
cd backend && go mod tidy   # ✅ correct
go mod tidy                 # ❌ wrong (root has no go.mod)
```
