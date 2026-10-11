# Aubit AI

Aubit AI is an Electron desktop companion with a browser-friendly frontend and a local FastAPI backend.

## Project Map

Keep the repo mentally split like this:

- `index.html`, `widget.html`, and game HTML files: frontend entry pages.
- `src/`: frontend JavaScript, CSS, assets, and bundled game/vendor files.
- `electron/`: voice assistant command bridge, preload bridge, tray/window behavior, widget mode, and backend auto-start logic.
- `backend/`: FastAPI backend source, API routes, services, auth, storage, integrations, and Python requirements.
- `images/`, `models/`, `build/`: real app assets used by the frontend and Electron packaging.
- `docs/`: architecture notes and third-party license files.
- `scripts/`: local helper scripts.

Generated folders such as `node_modules/`, `dist*/`, `tmp/`, Python `__pycache__/`, local logs, and `backend/.venv/` are intentionally not source. Recreate them when needed.

## Run The Frontend In A Browser

From the project root:

```powershell
python -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173
```

The root `index.html` is the main Aubit app. `widget.html` is the compact desktop companion view.

## Run The Backend

Create the Python environment once:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Start the API from the project root:

```powershell
npm run backend:start
```

Health check:

```text
http://127.0.0.1:8000/api/health
```

The backend runs without cloud keys by using local fallbacks. Add keys to `backend/.env` only for services you want live, such as Gemini, Groq, OpenAI, MongoDB, Redis, Firebase, GCP Storage, ElevenLabs, Stripe, or Sentry.

## Run The Desktop App

Install JavaScript dependencies once:

```powershell
npm install
```

Launch Aubit:

```powershell
npm run start
```

Electron opens the immersive app window and the desktop widget. On Windows it also checks the backend health endpoint, tries to auto-start the backend when `backend/.venv` exists, and powers voice actions such as YouTube, music, news, Google search, app launching, and media control.

## Bluetooth Phone Bridge

Aubit includes the PC-side hooks for a Bluetooth phone bridge. Voice commands such as `open Bluetooth`, `connect my phone`, `phone status`, and `tell my phone to open YouTube` are recognized by the desktop app.

Actual phone control requires a paired phone running an Aubit mobile companion app that listens for approved Bluetooth commands. Without that phone app, Aubit can open Windows Bluetooth settings and explain the next setup step, but it cannot safely control the phone directly.

## Build

```powershell
npm run dist
```

Build output goes to `dist*` folders. Those folders are generated and can be deleted safely.

## Checks

```powershell
npm run check
```

This validates the JavaScript entry points without rebuilding the app.
