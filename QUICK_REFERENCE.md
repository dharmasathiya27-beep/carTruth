# 🚗 CarTruth MVP - Developer Quick Reference

## 🚀 Start Development (30 seconds)

### Terminal 1 - Backend
```bash
cd backend
source venv/bin/activate          # or venv\Scripts\activate on Windows
python run.py
```
→ Backend ready at: **http://localhost:8000**

### Terminal 2 - Frontend  
```bash
cd frontend
npm run dev
```
→ Frontend ready at: **http://localhost:3000**

---

## 🧪 Test These Registrations

| Code | Vehicle | Year | Status |
|------|---------|------|--------|
| `AB20OXY` | BMW 3 Series | 2020 | ✅ Good |
| `YM70EUH` | Toyota Corolla | 2020 | ✅ Good |
| `GX15EWS` | Ford Fiesta | 2015 | ⚠️ Issues |
| `MK22XYZ` | Tesla Model 3 | 2022 | ✅ Excellent |

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI entry point |
| `backend/app/services/vehicle_service.py` | Mock data + scoring logic |
| `backend/app/routes/vehicle.py` | API endpoints |
| `frontend/app/page.tsx` | Landing page |
| `frontend/app/report/[registration]/page.tsx` | Report page |
| `frontend/lib/api.ts` | API client |

---

## 🔧 Common Commands

### Backend
```bash
cd backend
source venv/bin/activate          # Activate virtual env
pip install -r requirements.txt   # Install dependencies
python run.py                     # Start server
deactivate                        # Exit virtual env
```

### Frontend
```bash
cd frontend
npm install                       # Install dependencies
npm run dev                       # Start dev server
npm run build                     # Build for production
npm start                         # Start production server
```

---

## 🌐 URLs

| URL | Purpose |
|-----|---------|
| `http://localhost:3000` | Frontend (landing page) |
| `http://localhost:3000/report/AB20OXY` | Report page |
| `http://localhost:8000` | Backend API |
| `http://localhost:8000/docs` | API documentation (Swagger) |
| `http://localhost:8000/redoc` | API docs (ReDoc) |

---

## 📡 API Quick Reference

### Search Vehicle
```bash
curl -X POST http://localhost:8000/api/vehicle/search \
  -H "Content-Type: application/json" \
  -d '{"registration": "AB20OXY"}'
```

### Health Check
```bash
curl http://localhost:8000/api/vehicle/health
```

---

## 💻 Code Structure

### Backend Service (`vehicle_service.py`)
```python
# Mock data dictionaries
MOCK_VEHICLES              # Vehicle base info
MOCK_MOT_HISTORY          # MOT test records
MOCK_MILEAGE_HISTORY      # Mileage data

# Main functions
get_vehicle_by_registration()     # Lookup vehicle
get_mot_history()                 # Get MOT records
get_mileage_history()             # Get mileage
calculate_ownership_score()       # AI scoring
generate_vehicle_report()         # Full report
```

### Frontend Components
```
SearchBox.tsx         → Search interface
ScoreDisplay.tsx      → Circular score (0-100)
VehicleSummary.tsx    → Vehicle info + insights
MOTTimeline.tsx       → MOT history timeline
MileageTrend.tsx      → Mileage chart
Header.tsx            → Top navigation
```

---

## 🎨 Design System

**Colors:**
- Background: `#03071e` (slate-950)
- Primary: `#2563eb` (blue-600)
- Accent: `#a855f7` (purple-600)
- Success: `#10b981` (emerald-500)
- Warning: `#f59e0b` (amber-500)
- Error: `#ef4444` (red-500)

**Components:**
- Glass cards: `.glass` class
- Icons: Lucide React
- Animations: Tailwind transitions

---

## 🔄 Data Flow

```
User → SearchBox 
    → API Call (axios)
    → Backend FastAPI
    → vehicle_service.py
    → Mock data lookup
    → Scoring algorithm
    → JSON response
    → Frontend state
    → Report page render
```

---

## 📝 Add New Vehicle (Mock Data)

1. **Open:** `backend/app/services/vehicle_service.py`
2. **Find:** `MOCK_VEHICLES` dict (around line 10)
3. **Add:**
```python
"XX23ABC": {
    "make": "Honda",
    "model": "Civic",
    "year": 2023,
    "colour": "Blue",
    "fuel_type": "Hybrid",
    "engine_size": 1.5,
    "registration": "XX23ABC",
    "tax_status": "Taxed",
    "tax_due_date": date(2025, 6, 15),
},
```
4. **Add MOT history** to `MOCK_MOT_HISTORY`
5. **Add mileage** to `MOCK_MILEAGE_HISTORY`
6. **Restart** backend server

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | `lsof -ti:3000 \| xargs kill -9` |
| Venv not activating | Use `python3 -m venv venv` |
| Dependencies fail | `pip install --no-cache-dir -r requirements.txt` |
| API not responding | Check backend is running at :8000 |
| Styling broken | `rm -rf frontend/.next && npm run dev` |

---

## 📌 TODO Markers in Code

Search for these comments to find integration points:

```python
# TODO: Replace with real DVLA API call
# TODO: Replace with real DVSA API call  
# TODO: Connect to real database
# TODO: Add authentication
```

---

## 🚢 Deploy

### Frontend (Vercel)
```bash
npm install -g vercel
vercel login
vercel
```

### Backend (Heroku)
```bash
heroku create cartruth-api
git push heroku main
```

---

## 📊 Ownership Score Levels

| Score | Level | Recommendation |
|-------|-------|-----------------|
| 80-100 | Excellent | ✅ Buy with confidence |
| 60-79 | Good | ✅ Good value, get inspection |
| 40-59 | Fair | ⚠️ Negotiate, consider alternatives |
| 0-39 | Poor | ❌ High risk, look elsewhere |

---

## 🔐 Security Notes

- ✅ Type validation (Pydantic + TypeScript)
- ✅ Input sanitization
- ⚠️ Add authentication before production
- ⚠️ Add rate limiting before production
- ⚠️ Use HTTPS in production
- ⚠️ Validate API keys for real DVLA/DVSA APIs

---

## 📞 Need Help?

1. **Setup issues?** → See `GETTING_STARTED.md`
2. **API questions?** → Visit `http://localhost:8000/docs`
3. **Code structure?** → Read `PROJECT_SUMMARY.md`
4. **Full docs?** → See `README.md`

---

**Version:** 0.1.0 | **Last Updated:** May 2026 | **Status:** MVP Ready
