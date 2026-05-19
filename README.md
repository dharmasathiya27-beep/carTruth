# CarTruth - MVP Website

A premium AI car intelligence platform that provides detailed vehicle reports for UK registration numbers.

## Features

✅ **Landing Page** - Modern, premium design with hero section and feature cards
✅ **Vehicle Search** - Enter UK registration number to search
✅ **Vehicle Report** - Complete vehicle information display:
  - Vehicle details (make, model, year, fuel type, engine size, colour, tax status)
  - MOT status and history timeline with defects/advisory items
  - Mileage trends and analysis
  - AI-generated ownership score (0-100)
  - Plain English insights:
    - What looks good
    - Potential problems
    - Expected yearly running costs
    - Should you buy it? recommendation

✅ **Mock Data** - Pre-loaded with sample vehicles for testing
✅ **Responsive Design** - Works on desktop, tablet, and mobile
✅ **Premium UI** - Glass morphism, gradients, smooth animations

## Project Structure

```
carTruth/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI app entry
│   │   ├── models/
│   │   │   └── schemas.py      # Pydantic models
│   │   ├── services/
│   │   │   └── vehicle_service.py  # Mock data & business logic
│   │   └── routes/
│   │       └── vehicle.py      # API endpoints
│   ├── run.py                 # Server entry point
│   └── requirements.txt        # Python dependencies
│
└── frontend/                   # Next.js frontend
    ├── app/
    │   ├── page.tsx           # Landing page
    │   ├── layout.tsx         # Root layout
    │   └── report/[registration]/
    │       └── page.tsx       # Vehicle report page
    ├── components/            # React components
    │   ├── Header.tsx
    │   ├── SearchBox.tsx
    │   ├── ScoreDisplay.tsx
    │   ├── VehicleSummary.tsx
    │   ├── MOTTimeline.tsx
    │   └── MileageTrend.tsx
    ├── lib/
    │   └── api.ts            # API client
    ├── styles/
    │   └── globals.css       # Global styles
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.ts
    └── tsconfig.json
```

## Getting Started

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.9+ (for backend)
- **npm** or **yarn** (for frontend package manager)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create a Python virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the server:**
   ```bash
   python run.py
   ```

   The API will be available at `http://localhost:8000`
   - Interactive API docs: `http://localhost:8000/docs`

### Frontend Setup

1. **In a new terminal, navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## Testing the MVP

Once both servers are running:

1. **Open** `http://localhost:3000` in your browser
2. **Try these example registrations:**
   - `AB20OXY` - 2020 BMW 3 Series Diesel
   - `YM70EUH` - 2020 Toyota Corolla Hybrid
   - `GX15EWS` - 2015 Ford Fiesta Petrol (with MOT failures)
   - `MK22XYZ` - 2022 Tesla Model 3 Electric

Each will generate a unique report with mock MOT history, mileage trends, and AI-generated ownership scores.

## Mock Data

The backend includes mock data for the above registrations. In production, replace the `vehicle_service.py` with real API calls to:
- **DVLA API** - Vehicle registration and tax information
- **DVSA API** - MOT history and test results

All integration points are marked with `# TODO:` comments in the code.

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Pydantic** - Data validation and settings management
- **Uvicorn** - ASGI server

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Axios** - HTTP client

## API Endpoints

### POST `/api/vehicle/search`
Search for a vehicle by registration number.

**Request:**
```json
{
  "registration": "AB20OXY"
}
```

**Response:**
```json
{
  "vehicle": {
    "make": "BMW",
    "model": "3 Series",
    "year": 2020,
    "colour": "Black",
    "fuel_type": "Diesel",
    "engine_size": 2.0,
    "registration": "AB20OXY",
    "tax_status": "Taxed",
    "tax_due_date": "2025-06-30"
  },
  "current_mot_status": "Valid",
  "mot_valid_until": "2025-11-15",
  "mot_history": [...],
  "mileage_history": [...],
  "ownership_score": {
    "score": 82,
    "summary": "Ownership Score: 82/100",
    "what_looks_good": "Recent model year; Lower than average mileage for age",
    "potential_problems": "No significant issues identified",
    "expected_yearly_cost": "£1400/year",
    "should_buy_recommendation": "This looks like a solid choice..."
  }
}
```

### GET `/api/vehicle/health`
Health check endpoint.

## Ownership Score Algorithm

The score is calculated based on:
- **Vehicle age** (-15 points if >10 years, +5 if <3 years)
- **Mileage** (-12 points if significantly higher than average, +8 if lower)
- **Fuel type** (+10 for Electric, +5 for Hybrid)
- **MOT history** (-20 for failed tests, -8 for multiple advisories)
- **Maintenance patterns** (based on defect frequency)

Result: 0-100 scale with plain English interpretation.

## Future Enhancements

- [ ] Real DVLA API integration
- [ ] Real DVSA API integration
- [ ] User authentication & saved vehicles
- [ ] Vehicle comparison tool
- [ ] Export reports as PDF
- [ ] Enhanced AI analysis with ML models
- [ ] Mobile app (React Native)
- [ ] Admin dashboard for monitoring
- [ ] Rate limiting and usage analytics

## Production Deployment

### Backend
```bash
# Using Gunicorn in production
pip install gunicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

### Frontend
```bash
npm run build
npm start
```

Deploy on Vercel (recommended for Next.js), Netlify, or your own infrastructure.

## License

MIT

## Support

For questions or issues, please check the code comments marked with `# TODO:` and `# NOTE:` which indicate areas for future implementation.

---

**Built with:** Next.js, FastAPI, Tailwind CSS, Python
**Status:** MVP (Version 0.1.0)
