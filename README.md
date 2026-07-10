# CarTruth

CarTruth is a UK vehicle intelligence MVP. A user enters a registration number, the Next.js frontend calls a FastAPI backend, and the backend builds a report from DVLA vehicle data, DVSA MOT history, deterministic CarTruth scoring, optional LLM wording, and optional Supabase caching.

The project is currently an MVP. It does not include login, payments, subscriptions, or admin tooling.

## What Happens On A Search

1. `frontend/components/SearchBox.tsx` normalises a UK registration and routes to `/report/[registration]`.
2. `frontend/app/report/[registration]/page.tsx` calls `searchVehicle()` from `frontend/lib/api.ts`.
3. `backend/app/routes/vehicle.py` receives `POST /api/vehicle/search`.
4. `backend/app/services/vehicle_service.py` checks the Supabase report cache when configured.
5. If there is no fresh cached report, the backend fetches DVLA vehicle details and DVSA MOT history.
6. DVSA MOT data is normalised by `backend/app/services/mot_data_normalizer.py`.
7. CarTruth enriches missing identity fields, builds mileage/MOT intelligence, and calculates the ownership score.
8. Optional Gemini/Groq wording may be attached, but the rule engine remains the source of truth.
9. The frontend renders the report, PDF/print/share actions, and feedback form.

## Main Features

- UK registration search through FastAPI.
- DVLA Vehicle Enquiry API integration for vehicle identity, tax, MOT status, emissions, and registration fields.
- DVSA MOT History API integration with OAuth 2.0 client credentials.
- Mock vehicle and MOT fallback data for local development.
- MOT advisory classification, repeated issue detection, mileage trend analysis, and maintenance warnings.
- Rule-based ownership score, verdict, risk level, running cost estimate, reliability rating, and environmental rating.
- Optional Gemini/Groq JSON report wording for buyer-friendly insights.
- Supabase frontend feedback capture through the `cartruth.feedback` table.
- Supabase backend report/source/AI caching through `vehicle_source_cache`, `vehicle_report_cache`, and `ai_report_cache`.
- Share link, print report, summary PDF capture, and backend-generated Playwright PDF download.

## Project Structure

```text
carTruth/
├── backend/
│   ├── app/
│   │   ├── config.py                 # env config
│   │   ├── main.py                   # FastAPI app and CORS
│   │   ├── models/                   # Pydantic request/response models
│   │   ├── routes/vehicle.py         # search, PDF, and health endpoints
│   │   └── services/                 # DVLA, DVSA, cache, scoring, PDF, LLM
│   ├── tests/
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── app/                          # Next.js app routes
│   ├── components/                   # report UI components
│   ├── lib/                          # API and Supabase clients
│   ├── styles/
│   └── package.json
├── setup.sh
├── setup.bat
├── render.yaml
└── README.md
```

## Quick Start

On macOS/Linux:

```bash
./setup.sh
```

On Windows:

```bat
setup.bat
```

Then start the backend:

```bash
cd backend
source venv/bin/activate
python run.py
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`.

Mock registrations that work without official API credentials:

```text
AB20OXY
YM70EUH
GX15EWS
MK22XYZ
```

## Manual Setup

Backend:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m playwright install chromium
python run.py
```

The backend runs on `http://localhost:8000`.

Frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000`.

## Environment Files

Copy the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

For local mock mode, keep this in `backend/.env`:

```bash
APP_ENV=development
USE_MOCK_DATA=true
ALLOW_MOCK_MOT_FALLBACK=true
FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

For live data, set `USE_MOCK_DATA=false` and add:

```bash
DVLA_API_KEY=...
DVSA_CLIENT_ID=...
DVSA_CLIENT_SECRET=...
DVSA_API_KEY=...
DVSA_SCOPE_URL=https://tapi.dvsa.gov.uk/.default
DVSA_TOKEN_URL=https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token
```

Optional backend-only services:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ENABLE_LLM_REPORT_WRITER=false
LLM_PROVIDER=gemini
GEMINI_API_KEY=...
GROQ_API_KEY=...
```

Frontend:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `DVLA_API_KEY`, `DVSA_CLIENT_SECRET`, `GEMINI_API_KEY`, or `GROQ_API_KEY` to the frontend.

## Useful Commands

Backend tests from the repo root:

```bash
backend/venv/bin/python -m pytest
```

Backend tests from `backend/`:

```bash
venv/bin/python -m pytest tests
```

Backend formatting:

```bash
cd backend
venv/bin/python -m black app tests
venv/bin/python -m isort app tests
```

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

## API Endpoints

### `POST /api/vehicle/search`

Request:

```json
{
  "registration": "SW60DGO"
}
```

Response includes:

- `vehicle`
- `current_mot_status`
- `mot_valid_until`
- `mot_history`
- `mileage_history`
- `mot_intelligence`
- `ownership_score`
- `ai_report`, when optional AI wording is enabled or fallback wording is attached
- `data_source`
- `confidence_level`
- `trust_messages`
- `warnings`

### `GET /api/vehicle/{registration}/pdf`

Generates a downloadable PDF report using backend Playwright/Chromium.

### `GET /api/vehicle/health`

Returns vehicle router health and integration configuration flags.

### `GET /health`

Top-level deployment health check. It does not expose secret values.

## Caching

There are two cache layers:

- `backend/app/services/lookup_cache.py`: small in-memory TTL cache for DVLA/DVSA lookups.
- `backend/app/services/supabase_cache_service.py`: optional persistent cache for source data, full reports, and AI report wording.

The main search endpoint now calls `generate_vehicle_report_with_cache()`. If Supabase credentials are missing or Supabase fails, cache calls return misses and the live/mock report path still runs.

## Optional AI Wording

The rule engine owns the actual score, verdict, risk level, MOT intelligence, and cost estimates. Optional Gemini/Groq output only rewrites existing facts into buyer-friendly wording.

To enable it:

```bash
ENABLE_LLM_REPORT_WRITER=true
LLM_PROVIDER=gemini
GEMINI_API_KEY=...
```

If the provider fails or returns invalid JSON, the backend falls back to rule-based copy.

## Issues Found In This Pass

- Running backend tests from the repo root previously failed with `ModuleNotFoundError: app`; `pyproject.toml` now adds `backend` to pytest's Python path, so `backend/venv/bin/python -m pytest` works from the root.
- The search route had a cache-aware service implemented but was calling the direct Gemini/live path. The route now uses `generate_vehicle_report_with_cache()`.
- `pyproject.toml` is not the canonical backend dependency list. Use `backend/requirements.txt` for the FastAPI backend until the Python packaging story is unified.
- `backend/venv` exists locally inside the repo. It is ignored by git, but it makes broad searches noisy. It is safe to leave locally or recreate outside the repo later.

## Checks From This Pass

These passed on 2026-07-10:

```bash
backend/venv/bin/python -m pytest
cd frontend && npm run lint
cd frontend && npm run build
```

## Deployment Notes

The repo is prepared for a Render backend plus Vercel frontend deployment.

### Backend On Render

You can create the backend from `render.yaml` as a Render Blueprint, or create a Web Service manually with these settings:

- Root directory: `backend`
- Build command: `pip install -r requirements.txt && python -m playwright install chromium`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health`
- Runtime: Python, pinned by `backend/runtime.txt`

Required production environment values:

```bash
APP_ENV=production
USE_MOCK_DATA=false
ALLOW_MOCK_MOT_FALLBACK=false
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
DVLA_API_KEY=...
DVSA_CLIENT_ID=...
DVSA_CLIENT_SECRET=...
DVSA_API_KEY=...
DVSA_SCOPE_URL=https://tapi.dvsa.gov.uk/.default
DVSA_TOKEN_URL=https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token
```

Optional production environment values:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ENABLE_LLM_REPORT_WRITER=true
LLM_PROVIDER=gemini
GEMINI_API_KEY=...
GROQ_API_KEY=...
```

### Frontend On Vercel

The frontend has `frontend/vercel.json` and should be imported as a Vercel project with:

- Root directory: `frontend`
- Framework preset: Next.js
- Build command: `npm run build`
- Install command: `npm ci`
- Set `NEXT_PUBLIC_API_BASE_URL` to the deployed backend URL.

Required frontend environment values:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are only needed if feedback capture is enabled.

After Vercel gives you a production URL, add that URL to backend `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` in Render, then redeploy the backend.

### Production Smoke Checks

After both services are deployed:

```bash
curl https://your-backend.onrender.com/health
curl -X POST https://your-backend.onrender.com/api/vehicle/search \
  -H "Content-Type: application/json" \
  -d '{"registration":"SW60DGO"}'
```

Then open the Vercel URL and search the same registration.
