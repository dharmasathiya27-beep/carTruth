# CarTruth

CarTruth is a UK vehicle intelligence MVP built with a Next.js 14 frontend and a FastAPI backend. It searches a registration number, calls official vehicle data services from the backend, and presents a premium report with ownership scoring, MOT intelligence, mileage trends, trust messaging, feedback capture, and share/print/PDF utilities.

## Current Features

- UK registration search through the FastAPI backend
- DVLA Vehicle Enquiry API integration for vehicle, tax, MOT status, emissions, and registration data
- DVSA MOT History API integration with OAuth 2.0 client credentials
- Safe mock/fallback mode for local development and API failures
- Normalised MOT schema shared by mock and DVSA data
- Rule-based ownership score, risk level, running cost estimate, reliability rating, and environmental rating
- Optional Gemini report-writer enhancement for buyer-friendly narrative summaries, with the rule engine retained as the source of truth
- MOT advisory classification, repeated issue detection, severity badges, and maintenance warnings
- Mileage trend, latest mileage, maintenance window, and ownership pattern insights
- Confidence and data source messaging
- Supabase feedback storage in the `cartruth.feedback` table using frontend-safe anon credentials
- Share link, print report, summary copy, and real PDF download actions
- Backend-generated premium PDF reports through Playwright at `/api/vehicle/{registration}/pdf`

CarTruth does not currently include login, payments, subscriptions, or admin tooling.

## Project Structure

```text
carTruth/
├── backend/
│   ├── app/
│   │   ├── config.py
│   │   ├── main.py
│   │   ├── models/
│   │   │   ├── mot_schema.py
│   │   │   └── schemas.py
│   │   ├── routes/
│   │   │   └── vehicle.py
│   │   └── services/
│   │       ├── dvla_service.py
│   │       ├── dvsa_auth_service.py
│   │       ├── dvsa_service.py
│   │       ├── gemini_report_writer.py
│   │       ├── lookup_cache.py
│   │       ├── mock_vehicle_service.py
│   │       ├── mot_analysis_service.py
│   │       ├── mot_data_normalizer.py
│   │       ├── pdf_service.py
│   │       ├── vehicle_analysis_service.py
│   │       └── vehicle_service.py
│   ├── tests/
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── styles/
│   └── package.json
├── .env.example
├── pyproject.toml
└── README.md
```

## Environment Variables

Copy the example file into the backend folder:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Set these values in `backend/.env`:

```bash
APP_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
USE_MOCK_DATA=false
ALLOW_MOCK_MOT_FALLBACK=true

DVLA_API_KEY=your_dvla_key
DVLA_API_BASE_URL=https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles

DVSA_CLIENT_ID=your_dvsa_client_id
DVSA_CLIENT_SECRET=your_dvsa_client_secret
DVSA_API_KEY=your_dvsa_api_key
DVSA_SCOPE_URL=https://tapi.dvsa.gov.uk/.default
DVSA_TOKEN_URL=https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token
DVSA_API_BASE_URL=https://history.mot.api.gov.uk/v1/trade/vehicles/registration

CACHE_ENABLED=true
CACHE_DVLA_TTL_SECONDS=900
CACHE_DVSA_TTL_SECONDS=900
CACHE_REPORT_TTL_SECONDS=300

ENABLE_LLM_REPORT_WRITER=false
GEMINI_API_KEY=your_optional_gemini_key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TIMEOUT_SECONDS=8
```

Secrets stay in the backend only. The frontend calls CarTruth's FastAPI backend and never calls DVLA or DVSA directly.

Set this value in `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The Supabase anon key is used only for no-auth feedback submissions. Do not expose a service role key in the frontend.

## Run Locally

Start the backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m playwright install chromium
uvicorn app.main:app --reload
```

Start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` and search a registration such as `SW60DGO`.

## Developer Commands

Backend:

```bash
cd backend
venv/bin/python -m black app tests
venv/bin/python -m isort app tests
venv/bin/python -m pytest
```

Frontend:

```bash
cd frontend
npm run format
npm run lint
npm run build
```

## API Endpoints

### `POST /api/vehicle/search`

Search for a vehicle by registration number.

```json
{
  "registration": "SW60DGO"
}
```

The response includes:

- `vehicle`
- `current_mot_status`
- `mot_valid_until`
- `mot_history`
- `mileage_history`
- `mot_intelligence`
- `ownership_score`
- `data_source`
- `confidence_level`
- `trust_messages`
- `warnings`

### `GET /api/vehicle/health`

Returns backend health status.

### `GET /api/vehicle/{registration}/pdf`

Generates and returns a downloadable premium PDF report from a lightweight backend HTML template. The PDF includes the branded header, vehicle identity, ownership score, verdict, running cost, MOT overview, top risks, mileage summary, confidence note, and disclaimer.

### `GET /health`

Top-level deployment health check. It returns backend status and whether DVLA/DVSA config exists without exposing secret values.

## Feedback Storage

The report feedback card inserts rows into the existing Supabase `cartruth.feedback` table. The frontend uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, maps fields with the table's snake_case names, and does not require authentication.

## Caching

The backend uses a small in-memory TTL cache for DVLA lookups, DVSA lookups, and final vehicle report responses. TTLs are configurable with `CACHE_DVLA_TTL_SECONDS`, `CACHE_DVSA_TTL_SECONDS`, and `CACHE_REPORT_TTL_SECONDS`; set `CACHE_ENABLED=false` to bypass the cache locally. The cache is intentionally simple and can be replaced later with Redis or another production cache if traffic requires it.

## Optional LLM Report Writer

The rule engine remains the source of truth for score, verdict, risk level, MOT intelligence, running cost, and warnings. When `ENABLE_LLM_REPORT_WRITER=true` and `GEMINI_API_KEY` is configured, Gemini can rewrite the rule-based facts into a concise buyer-friendly summary. If Gemini is unavailable, CarTruth falls back to the existing rule-based summary.

## Testing Notes

The backend tests cover invalid registration handling, API failure fallback, mock fallback behavior, MOT advisory analysis, and mileage inconsistency detection.

## Deployment

### Backend On Render

Create a new Render Web Service from this repository.

Recommended settings:

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health`

Required backend environment variables:

```bash
APP_ENV=production
PORT=10000
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
USE_MOCK_DATA=false
ALLOW_MOCK_MOT_FALLBACK=false

DVLA_API_KEY=...
DVLA_API_BASE_URL=https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles
DVLA_TIMEOUT_SECONDS=8

DVSA_CLIENT_ID=...
DVSA_CLIENT_SECRET=...
DVSA_API_KEY=...
DVSA_SCOPE_URL=https://tapi.dvsa.gov.uk/.default
DVSA_TOKEN_URL=https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token
DVSA_API_BASE_URL=https://history.mot.api.gov.uk/v1/trade/vehicles/registration
DVSA_TOKEN_TIMEOUT_SECONDS=10
DVSA_TIMEOUT_SECONDS=10

CACHE_ENABLED=true
CACHE_DVLA_TTL_SECONDS=900
CACHE_DVSA_TTL_SECONDS=900
CACHE_REPORT_TTL_SECONDS=300

ENABLE_LLM_REPORT_WRITER=false
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TIMEOUT_SECONDS=8
```

Render provides `PORT` automatically for web services. Keep the start command using `$PORT`.

### Frontend On Vercel

Create a new Vercel project from this repository.

Recommended settings:

- Root directory: `frontend`
- Framework preset: Next.js
- Build command: `npm run build`
- Output: Vercel default

Required frontend environment variable:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

After Vercel gives you a production URL, add that URL to the backend `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` values in Render.

### Test Production Connection

Check backend health:

```bash
curl https://your-backend.onrender.com/health
```

Expected shape:

```json
{
  "status": "ok",
  "service": "cartruth-api",
  "environment": "production",
  "integrations": {
    "dvla_configured": true,
    "dvsa_configured": true
  }
}
```

Check a registration lookup:

```bash
curl -X POST https://your-backend.onrender.com/api/vehicle/search \
  -H "Content-Type: application/json" \
  -d '{"registration":"SW60DGO"}'
```

Then open the Vercel frontend and search the same registration.

## Production Checklist

- DVLA API key added to Render.
- DVSA client ID, client secret, API key, scope URL, token URL, and MOT API base URL added to Render.
- `APP_ENV=production`.
- `USE_MOCK_DATA=false`.
- `ALLOW_MOCK_MOT_FALLBACK=false`, unless you intentionally want fallback data in production.
- `FRONTEND_URL` points to the Vercel production URL.
- `CORS_ALLOWED_ORIGINS` includes the Vercel production URL.
- Vercel has `NEXT_PUBLIC_API_BASE_URL` set to the Render backend URL.
- Vercel has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set if feedback capture is enabled.
- Playwright Chromium is installed in the backend deployment image for PDF generation.
- `https://your-backend.onrender.com/health` returns `status: ok`.
- A known valid registration lookup returns a report.

## Status

MVP in active development. DVLA and DVSA integrations are live backend features, with mock/fallback data retained for resilience and local development.
