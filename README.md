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

## Text to 3D Models

Select **Text to 3D** in the home room. Describe an object, generate it locally, rotate it in the viewer, and download GLB or STL. No cloud account, API key, or internet connection is required. The backend uses Aubit's own procedural modeling rules and saves models in your local Aubit data folder.

The full-screen studio includes Standard / Low Poly generation, color choices, a saved-model asset library with favorites, and scene controls for lighting, rotation, and the ground grid. Import a GLB file (up to 50 MB) for a session preview. Select **Properties** to export a generated model, or **Home** to return to Aubit.

The current generator recognizes robots, cars, chairs, tables, houses, trees, rockets, mugs, bottles, swords, cats and dogs, and basic shapes. Color, size, and a few object details in the prompt change the mesh. Other subjects produce an abstract geometric sculpture, clearly labeled in the app. This is a local procedural generator, so it does not offer the unrestricted detail of a trained text-to-3D model.

## Image to 3D

In the studio, select **Image to 3D**, upload one clear object photo, and choose
**Detailed → High Res** for the final mesh. Generation runs locally using the
open-source TripoSR model, with optional U2Net background removal. No Meshy API
or paid service is used. TripoSR is pretrained by Tripo AI and Stability AI;
it is not a model trained by Aubit.

Install the separate AI runtime and model weights once (several GB):

```powershell
backend\.venv\Scripts\python.exe backend\scripts\setup_image3d.py
```

The worker uses CUDA when available, with CPU fallback for insufficient GPU
memory. The original inferred geometry and colors are preserved by default.
High Res extracts a 320 × 320 × 320 grid; it cannot invent reliable fine details
or unseen surfaces from a single picture. Image Projection is experimental.
Old models marked **Needs regeneration** retain their files; generate them again
to apply the corrected surface processing.

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
