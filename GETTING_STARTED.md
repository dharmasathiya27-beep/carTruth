# 🚗 CarTruth MVP - Getting Started Guide

## Quick Start (2 minutes)

### Option 1: Automatic Setup (macOS/Linux)

```bash
chmod +x setup.sh
./setup.sh
```

Then follow the instructions at the end of the script.

### Option 2: Automatic Setup (Windows)

```bash
setup.bat
```

Then follow the instructions at the end of the script.

### Option 3: Manual Setup

#### Backend Setup

1. **Open a terminal and navigate to the backend:**
   ```bash
   cd backend
   ```

2. **Create a Python virtual environment:**
   ```bash
   python3 -m venv venv
   ```

3. **Activate the virtual environment:**
   - **macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```
   - **Windows:**
     ```bash
     venv\Scripts\activate.bat
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Create backend environment file:**
   ```bash
   cp ../.env.example .env
   ```

   For local MVP development, keep:
   ```bash
   USE_MOCK_DATA=true
   DVLA_API_KEY=
   DVSA_API_KEY=
   ```

6. **Start the backend server:**
   ```bash
   python run.py
   ```

   You should see:
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8000
   INFO:     Application startup complete
   ```

   To enable auto-reload during backend development:
   ```bash
   RELOAD=true python run.py
   ```

#### Frontend Setup

1. **Open a NEW terminal and navigate to the frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   > cartruth-frontend@0.1.0 dev
   > next dev
   
   ▲ Next.js 14.0.0
   - Local: http://localhost:3000
   ```

## Access the Application

Once both servers are running:

1. **Open your browser:** `http://localhost:3000`
2. **Try these registrations:**
   - `AB20OXY` - Premium 2020 BMW (clean history)
   - `YM70EUH` - 2020 Eco-friendly Hybrid
   - `GX15EWS` - 2015 Budget Petrol (with issues)
   - `MK22XYZ` - 2022 Premium Electric Tesla

## API Documentation

The FastAPI backend provides interactive API documentation:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### Test the API with curl:

```bash
curl -X POST http://localhost:8000/api/vehicle/search \
  -H "Content-Type: application/json" \
  -d '{"registration": "AB20OXY"}'
```

## Project Structure

```
carTruth/
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── models/schemas.py    # Data models
│   │   ├── services/vehicle_service.py  # Business logic
│   │   └── routes/vehicle.py    # API endpoints
│   ├── run.py                   # Server entry point
│   ├── requirements.txt         # Python dependencies
│   └── venv/                    # Virtual environment
│
├── frontend/                     # Next.js frontend
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   ├── layout.tsx           # Root layout
│   │   └── report/[registration]/page.tsx  # Report page
│   ├── components/              # React components
│   ├── lib/api.ts              # API client
│   ├── styles/globals.css      # Tailwind styles
│   ├── package.json
│   ├── tailwind.config.ts
│   └── node_modules/           # Dependencies
│
├── README.md                    # Full documentation
├── setup.sh                     # macOS/Linux setup
├── setup.bat                    # Windows setup
└── .gitignore
```

## Troubleshooting

### "Port 3000 already in use"
```bash
# Kill the process on port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "Port 8000 already in use"
```bash
# macOS/Linux:
lsof -ti:8000 | xargs kill -9

# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Python virtual environment not activating
- Make sure you're in the `backend` directory
- Try: `python3 -m venv venv` (instead of `python`)

### Dependencies not installing
```bash
# Clear pip cache and reinstall
pip install --no-cache-dir -r requirements.txt
```

### Frontend not loading
- Clear `.next` cache: `rm -rf frontend/.next`
- Restart: `npm run dev`

## Key Features

### 🎯 Landing Page
- Modern hero section with gradient text
- Feature highlights
- CTA with example registrations
- Responsive design

### 🔍 Search
- Premium search box with animations
- Real-time validation
- Error handling with helpful messages

### 📊 Vehicle Report
- Ownership score (0-100) with visual display
- Vehicle details overview
- MOT history timeline
- Mileage trend analysis
- AI insights:
  - What looks good
  - Potential problems
  - Expected yearly costs
  - Buy recommendation

### 🎨 Design System
- Dark theme with blue/purple accents
- Glass morphism effects
- Smooth animations
- Mobile responsive

## Code Highlights

### Backend Mock Data
```python
# backend/app/services/vehicle_service.py
# Contains mock vehicles, MOT history, and AI scoring logic
# TODO markers show where real DVLA/DVSA APIs will integrate
```

### Frontend Components
```
SearchBox.tsx        → Premium search interface
ScoreDisplay.tsx     → Circular ownership score
VehicleSummary.tsx   → Vehicle info + insights
MOTTimeline.tsx      → Historical MOT records
MileageTrend.tsx     → Mileage analysis chart
Header.tsx           → Navigation header
```

## Next Steps (Future Enhancements)

1. **Real API Integration**
   - Connect to DVLA API for registration/tax info
   - Connect to DVSA API for MOT records

2. **User Features**
   - User authentication
   - Save favorite vehicles
   - Vehicle comparison

3. **Data Enhancements**
   - Historical pricing data
   - Insurance group information
   - Service history tracking

4. **AI Improvements**
   - Machine learning for risk prediction
   - Market value estimation
   - Depreciation analysis

5. **Mobile App**
   - React Native version
   - iOS/Android apps

6. **Analytics**
   - User dashboard
   - Admin panel
   - Usage metrics

## Production Deployment

### Frontend (Vercel - Recommended)
```bash
npm install -g vercel
vercel
```

### Backend (Heroku, Railway, or DigitalOcean)
```bash
# Build Docker image
docker build -t cartruth-api .

# Deploy to your platform
```

## Support & Debugging

### Enable verbose logging:

**Backend:**
```python
# In app/main.py, change reload settings
uvicorn.run(..., log_level="debug")
```

**Frontend:**
```typescript
// In lib/api.ts
const response = await apiClient.post(...);
console.log('API Response:', response);
```

## Technologies Used

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.9+, Pydantic |
| Icons | Lucide React |
| HTTP | Axios |
| Server | Uvicorn |

---

**Status:** MVP v0.1.0
**Last Updated:** May 2026
**Ready for:** Real API integration, production deployment, team handoff
