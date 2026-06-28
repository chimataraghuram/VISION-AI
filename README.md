# VisionAI — AI Compliance Auditor & Voice Assessment Platform

> Upload a room photo → get instant AI-powered compliance scoring, issue detection, and action plans. Practice compliance knowledge with AI-generated voice interviews.

**Built with:** Gemini 2.5 Flash · FastAPI · React + Vite · TailwindCSS · SQLite · Web Speech API

---

## Features

| Feature | Description |
|---|---|
| 📸 **Image Analysis** | Upload any room photo for instant compliance scoring |
| 🤖 **Gemini Vision** | Real AI analysis via Gemini 2.5 Flash |
| 📊 **Compliance Score** | 0-100 score with circular progress visualization |
| ⚠️ **Issue Detection** | AI identifies specific compliance violations |
| ✅ **Action Plan** | Tailored recommendations to fix each issue |
| 🎙️ **Voice Interview** | 5-question AI interview with speech-to-text |
| 📈 **Dashboard** | Stats, trends, and recent reports |
| 📜 **History** | Browse and review all past assessments |

---

## Tech Stack

```
Frontend  → React 18 + Vite + TailwindCSS + Recharts + Axios
Backend   → FastAPI + SQLAlchemy + SQLite + Pillow
AI        → Google Gemini 2.5 Flash (Vision + Text)
Speech    → Web Speech API (browser-native)
Deploy    → Vercel (frontend) + Render (backend)
```

---

## Project Structure

```
visionai/
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── CircularScore.jsx
│   │   │   ├── IssueCard.jsx
│   │   │   ├── RecommendationList.jsx
│   │   │   ├── MicButton.jsx
│   │   │   ├── ScoreBadge.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorAlert.jsx
│   │   ├── pages/            # Page components
│   │   │   ├── Home.jsx      # Upload + Analysis results
│   │   │   ├── Dashboard.jsx # Stats + Trend chart
│   │   │   ├── History.jsx   # Report history + modal
│   │   │   └── Interview.jsx # Voice interview flow
│   │   ├── services/
│   │   │   └── api.js        # Axios API functions
│   │   ├── contexts/
│   │   │   └── AppContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vercel.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/
│   ├── routers/
│   │   ├── analyze.py        # POST /api/analyze
│   │   ├── interview.py      # POST /api/questions, /api/evaluate
│   │   ├── history.py        # GET /api/history
│   │   └── dashboard.py      # GET /api/dashboard
│   ├── services/
│   │   └── gemini_service.py # All Gemini AI calls
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── requirements.txt
│   └── render.yaml
│
├── .env.example
├── .gitignore
└── README.md
```

---

## Installation & Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Gemini API Key](https://aistudio.google.com/apikey)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start the server
uvicorn main:app --reload
```

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
copy .env.example .env
# VITE_API_URL=http://localhost:8000

# Start dev server
npm run dev
```

Open: http://localhost:5173

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio API key | `AIzaSy...` |
| `DATABASE_URL` | SQLite connection string | `sqlite:///./visionai.db` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` |

---

## Gemini API Setup

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click **Create API Key**
3. Copy the key
4. Add it to `backend/.env` as `GEMINI_API_KEY=<your_key>`

The app uses **Gemini 2.5 Flash** for:
- Image analysis (compliance scoring)
- Interview question generation
- Answer evaluation
- Final interview summary

---

## API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/analyze` | Analyze image for compliance |
| `POST` | `/api/questions` | Generate 5 interview questions |
| `POST` | `/api/evaluate` | Evaluate a voice answer |
| `POST` | `/api/interview/save` | Save completed interview |
| `GET` | `/api/history` | List all reports |
| `GET` | `/api/history/{id}` | Single report detail |
| `GET` | `/api/dashboard` | Dashboard statistics |
| `GET` | `/health` | Health check |

---

## Compliance Standards

- 🛡️ General Safety
- 🍽️ Kitchen Hygiene
- 💼 Office Safety
- 🏠 Hostel Safety
- 🏭 Warehouse Safety
- 🔬 Laboratory Safety

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build

# Push to GitHub, then import repo in Vercel
# Set environment variable: VITE_API_URL=https://your-backend.onrender.com
```

### Backend → Render

1. Push code to GitHub
2. Create new **Web Service** in Render
3. Connect your GitHub repo (`/backend` directory)
4. Set:
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add env variables: `GEMINI_API_KEY`, `FRONTEND_URL`
6. Deploy

---

## Voice Interview Notes

The voice interview uses the **Web Speech API** — a browser-native API.

- ✅ Fully supported in **Google Chrome**
- ⚠️ Partial support in Edge
- ❌ Not supported in Firefox (transcript will show error)

For best results, use Chrome with microphone permissions granted.

---

## License

MIT License — Built for educational and professional demonstration purposes.
