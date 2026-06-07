# 🏆 Sports Analytics Dashboard
### React + Node.js Full-Stack App

---

## 📁 Project Structure

```
sports-dashboard/
├── backend/
│   ├── data/
│   │   ├── matches.json        ← match history database
│   │   └── upcoming.json       ← upcoming fixtures
│   ├── server.js               ← Express API server
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── pages/
    │   │   ├── Overview.jsx    ← KPIs, charts, venues
    │   │   ├── Teams.jsx       ← win rates, H2H comparison
    │   │   ├── Players.jsx     ← leaderboard, stats table
    │   │   ├── Upcoming.jsx    ← fixture calendar
    │   │   └── Predictor.jsx   ← match outcome predictor
    │   ├── components/
    │   │   └── UI.jsx          ← reusable components
    │   ├── api.js              ← all API calls (axios)
    │   ├── utils.js            ← colors, helpers
    │   ├── App.jsx             ← root + navigation
    │   ├── index.js            ← entry point
    │   └── index.css           ← global styles
    └── package.json
```

---

## 🚀 Setup & Run

### Prerequisites
- Node.js v18+ installed → https://nodejs.org

---

### Step 1 — Start the Backend

```bash
cd sports-dashboard/backend
npm install
npm start
```

✅ API running at: **http://localhost:5000**

---

### Step 2 — Start the Frontend

Open a **new terminal**:

```bash
cd sports-dashboard/frontend
npm install
npm start
```

✅ App running at: **http://localhost:3000**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches` | All matches (filterable) |
| POST | `/api/matches` | Add a new match |
| PUT | `/api/matches/:id` | Update a match |
| DELETE | `/api/matches/:id` | Delete a match |
| GET | `/api/stats/overview` | KPI summary |
| GET | `/api/stats/teams` | Team win stats |
| GET | `/api/stats/players` | Player leaderboard |
| GET | `/api/stats/venues` | Venue breakdown |
| GET | `/api/stats/h2h` | Head-to-head data |
| GET | `/api/stats/predict` | Match prediction |
| GET | `/api/upcoming` | Upcoming fixtures |
| POST | `/api/upcoming` | Add upcoming match |
| DELETE | `/api/upcoming/:id` | Delete upcoming match |

### Filter Examples
```
GET /api/matches?sport=Cricket&gender=Men
GET /api/stats/teams?sport=Football&gender=Women
GET /api/stats/h2h?teamA=India&teamB=Australia&sport=Cricket
GET /api/stats/predict?teamA=Manchester+City&teamB=Arsenal&sport=Football
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 |
| Charts | Chart.js + react-chartjs-2 |
| HTTP client | Axios |
| Backend | Node.js + Express |
| Database | JSON files (easy to swap for MongoDB/SQLite) |
| Styling | Pure CSS with CSS variables |

---

## ➕ Adding More Data

Edit `backend/data/matches.json` to add match records:

```json
{
  "id": 100,
  "winner": "India",
  "loser": "Australia",
  "player": "Rohit Sharma",
  "score": 155,
  "venue": "Wankhede Stadium",
  "date": "2025-11-15",
  "sport": "Cricket",
  "gender": "Men",
  "toss": "Bat"
}
```

Or use the POST API:
```bash
curl -X POST http://localhost:5000/api/matches \
  -H "Content-Type: application/json" \
  -d '{"winner":"India","loser":"Australia","player":"Rohit Sharma","score":155,"venue":"Wankhede","date":"2025-11-15","sport":"Cricket","gender":"Men"}'
```
