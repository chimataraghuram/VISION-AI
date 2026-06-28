# 🛡️ VisionAI

### AI-Powered Compliance Auditor & Voice Assessment Platform

> **VisionAI** is an AI-powered compliance auditing platform that analyzes uploaded room images using **Google Gemini 2.5 Flash**, generates intelligent compliance reports, identifies safety gaps, recommends corrective actions, conducts AI-powered voice interviews, and visualizes historical compliance data through an interactive dashboard.

---

## 🔴 Live Demo

* [**Experience VisionAI Live Here**](https://vision-ai-seven-gamma.vercel.app/) *(Update this link if needed)*

---

## 🚀 Project Overview

VisionAI was developed as a technical assessment to demonstrate end-to-end AI application development using modern Full Stack technologies and Generative AI.

The application enables users to upload images of real-world environments such as offices, kitchens, laboratories, classrooms, warehouses, and hostels. Using AI vision capabilities, VisionAI evaluates compliance against selected standards, provides actionable recommendations, and assesses users' understanding through an AI-driven voice interview.

---

## ✨ Key Features

* 📷 AI-powered room image analysis
* 📊 Compliance scoring (0–100)
* ⚠️ Intelligent detection of compliance gaps
* 📝 AI-generated corrective action plan
* 🎤 Voice-based mock compliance interview
* 🤖 AI evaluation of spoken responses
* 📈 Interactive compliance dashboard
* 🗂️ Historical inspection reports
* ☁️ Cloud deployment ready
* 📱 Responsive modern interface

---

# 🖼️ Application Workflow

```text
Upload Room Image
        │
        ▼
Select Compliance Standard
        │
        ▼
Gemini Vision Analysis
        │
        ▼
Compliance Score
        │
        ▼
Detected Issues
        │
        ▼
AI Action Plan
        │
        ▼
Voice Interview
        │
        ▼
AI Answer Evaluation
        │
        ▼
Save Report
        │
        ▼
Dashboard & History
```

---

# 🎯 Supported Compliance Standards

* ✅ General Safety
* 🏢 Office Safety
* 🍳 Kitchen Hygiene
* 🏠 Hostel Safety
* 📦 Warehouse Safety
* 🧪 Laboratory Safety

---

# 🏗️ Technology Stack

| Category           | Technologies                 |
| ------------------ | ---------------------------- |
| Frontend           | React.js, Vite, Tailwind CSS |
| Backend            | FastAPI                      |
| Database           | SQLite                       |
| AI                 | Google Gemini 2.5 Flash      |
| Speech Recognition | Web Speech API               |
| Charts             | Recharts                     |
| Deployment         | Vercel & Render              |

---

# 🤖 AI Capabilities

VisionAI utilizes **Google Gemini 2.5 Flash** for:

* Image understanding
* Compliance scoring
* Gap detection
* AI-generated recommendations
* Interview question generation
* Voice answer evaluation
* Overall interview assessment

---

# 📂 Project Structure

```text
VisionAI/

├── frontend/
│   ├── public/
│   │   └── demo-images/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── utils/
│   └── package.json
│
├── backend/
│   ├── api/
│   ├── models/
│   ├── services/
│   ├── database.py
│   ├── main.py
│   └── requirements.txt
│
├── README.md
└── .env.example
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/chimataraghuram/VISION-AI.git

cd visionai
```

---

## Backend

```bash
cd backend

python -m venv venv

source venv/bin/activate

pip install -r requirements.txt

uvicorn main:app --reload
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```




# 🎤 Voice Interview

The interview module consists of five AI-generated questions based on the selected compliance standard.

Workflow:

1. Generate questions using Gemini AI.
2. Capture spoken responses using the Web Speech API.
3. Convert speech to text.
4. Evaluate responses using Gemini.
5. Display AI-generated feedback and scores.

---

# 📊 Dashboard

The dashboard provides:

* Total inspections
* Average compliance score
* Highest compliance score
* Lowest compliance score
* Compliance trend visualization
* Recent inspection history

---

# 📷 Demo Images

VisionAI includes multiple demo images for quick testing, covering:

* Office environments
* Kitchens
* Hostels
* Laboratories
* Warehouses

Users may also upload their own room images for analysis.

---

# 🚀 Deployment

Frontend

* Vercel

Backend

* Render / Vercel Serverless

API Documentation

```text
http://localhost:8000/docs
```

---

# 🔮 Future Enhancements

* PDF Compliance Reports
* User Authentication
* Multi-language Support
* Mobile Application
* Healthcare Compliance Standards
* AI Trend Analytics
* Team Collaboration

---

# 👨‍💻 Developer

**CHIMATA RAGHURAM**
* [LinkedIn](https://www.linkedin.com/in/chimataraghuram/)
* [GitHub](https://github.com/chimataraghuram)

Developed as an AI Full Stack Engineering technical assessment.

Built using **React**, **FastAPI**, **Gemini 2.5 Flash**, **Tailwind CSS**, and **SQLite**.

---

# 📄 License

This project is released under the **MIT License**.

---

⭐ If you found this project interesting, consider giving it a star!
