# Aubit Backend

This backend adds the missing server-side architecture for the frontend prototype.

## Included Layers

- API layer with FastAPI routes for `/api/login`, `/api/signup`, `/api/game`, `/api/ai-response`, `/api/assets/upload-url`, and `/api/health`
- Business logic layer for game rewards and AI response orchestration
- Database layer with repository abstractions and MongoDB-ready wiring
- Authentication and authorization with JWT plus a Firebase verification hook
- Cache layer with Redis support and an in-memory fallback
- External services layer with Gemini wired as the default AI brain plus OpenAI, ElevenLabs, and Stripe integration points
- File storage layer with GCP Storage configuration hook and local fallback
- Logging and monitoring via standard logging and optional Sentry
- Security middleware for validation, headers, and rate limiting
- Docker runtime for deployment

## Run Locally

1. Create a virtual environment.
2. Install dependencies.
3. Copy `.env.example` to `.env` and fill the values you need.
4. Start the API.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## Run Locally On Windows

From the project root, the fastest manual startup flow is:

```powershell
npm run backend:start
```

If you want to start it from inside the `backend` folder instead:

```powershell
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir .
```

Keep that PowerShell window open while Aubit is running. Then open a second PowerShell window in the project root and launch the desktop app with:

```powershell
npm run start
```

## API Key Setup

- For Gemini, set `AI_PROVIDER=gemini` and add `GEMINI_API_KEY` in `backend/.env`.
- For Groq, set `AI_PROVIDER=groq`, add `GROQ_API_KEY`, and optionally set `GROQ_MODEL`.
- For OpenAI, set `AI_PROVIDER=openai` and add `OPENAI_API_KEY` in `backend/.env`.
- Check `GET /api/health` to confirm whether live AI is enabled or Aubit is in local fallback mode.
- The voice assistant layer and frontend probe both `http://127.0.0.1:8000/api` and `http://127.0.0.1:8001/api`, but `8000` is the default backend port in this repo.

## Example Requests

Login:

```bash
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123","role":"user"}'
```

Process game result:

```bash
curl -X POST http://127.0.0.1:8000/api/game \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"demo-user","game_type":"sudoku","result":"win","score":980}'
```

Generate AI response:

```bash
curl -X POST http://127.0.0.1:8000/api/ai-response \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Explain gravity simply","use_voice":true,"context":{"topic":"physics"}}'
```

## Notes

- The current implementation is runnable without cloud credentials because each major integration has a local fallback.
- When `MONGODB_URI` is configured, users, AI responses, and game events are persisted in MongoDB. Otherwise the backend falls back to in-memory storage.
- Gemini is the default AI provider. Set `GEMINI_API_KEY` in `backend/.env` to enable live AI responses. The default model is `gemini-2.5-flash`.
- Groq is also supported through its OpenAI-compatible API. Set `AI_PROVIDER=groq`, add `GROQ_API_KEY`, and optionally change `GROQ_MODEL`.
- OpenAI is also supported. Set `AI_PROVIDER=openai`, add `OPENAI_API_KEY`, and optionally change `OPENAI_MODEL`.
- To use MongoDB, Redis, Firebase, GCP Storage, OpenAI, ElevenLabs, Stripe, or Sentry, populate the corresponding environment variables and replace the fallback stubs with live request logic where noted.
