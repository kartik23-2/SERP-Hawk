# HawkAI: AI-Powered Two-Way Outbound Calling Agent

HawkAI is an autonomous, agentic AI voice calling system engineered to automatically initiate phone calls to prospective customers, conduct two-way interactive voice conversations, extract structured lead requirements in real time using GenAI, and persist transcripts, call summaries, and outcomes in a PostgreSQL database accessible via a modern Next.js admin dashboard.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Frontend["Next.js Admin Dashboard (Port 3000)"]
        Dashboard["Dashboard Overview & Analytics"]
        CustMgmt["Customer Campaign Creator"]
        LiveCallUI["Interactive Two-Way Voice/Text Modal"]
        CallLogsUI["Call History & AI Summary Viewer"]
    end

    subgraph Backend["FastAPI AI Engine (Port 8000)"]
        API["REST API Router (/api/v1)"]
        WS["WebSocket Stream Manager (/ws/call/{id})"]
        
        subgraph AgenticCore["Agentic AI Core"]
            ContextMgr["Call Context & Slot State Machine"]
            GenAIEngine["Google Gemini 2.5 Flash LLM"]
            SlotExtractor["NLU Slot Extractor"]
            SummaryGen["Post-Call AI Summary Generator"]
        end

        subgraph VoiceEngine["Voice Pipeline"]
            STTService["Speech-To-Text (WebSpeech / Audio Frame)"]
            TTSService["Edge Neural TTS (en-IN-PrabhatNeural)"]
        end

        subgraph Telephony["Telephony Provider Layer"]
            TwilioSvc["Twilio Outbound REST & TwiML WebSocket"]
            SimulatedSvc["Browser WebRTC / Live Simulation Mode"]
        end
    end

    subgraph Database["PostgreSQL / SQLite Database"]
        CustomersTable[("customers")]
        CallsTable[("calls")]
        TranscriptsTable[("call_transcripts")]
        SummariesTable[("call_summaries")]
    end

    Dashboard --> API
    CustMgmt --> API
    LiveCallUI <--> WS
    CallLogsUI --> API

    WS <--> AgenticCore
    WS <--> VoiceEngine
    API <--> Telephony

    API --> Database
    AgenticCore --> Database
```

---

## 🌟 Key Features

1. **Automated Outbound Calling**:
   - Single-click campaign call initiation from the admin dashboard without requiring human operator intervention.
   - Dual-mode support: Real Twilio PSTN phone call integration AND interactive WebRTC/Browser live call simulation mode.

2. **Two-Way Voice Communication**:
   - Natural speech interaction: Speech-To-Text (STT) converts customer voice -> LLM processes turn -> Edge Neural TTS (`en-IN-PrabhatNeural`) streams crystal-clear audio back to the customer.

3. **Agentic AI State Machine**:
   - Tracks collected customer information slots: `Requirement`, `RO Capacity (LPH)`, `Location`, `Application (Hotel/Hospital/Canteen)`, `Budget`, `Timeline`.
   - Recognizes missing information and asks ONLY for missing slots.
   - Answers technical customer queries (warranties, prices, filtration stages) while maintaining conversation momentum.

4. **Post-Call AI Lead Analysis**:
   - Automatically generates structured call summaries post-call.
   - Categorizes lead status (`Hot`, `Warm`, `Cold`, `Not Interested`, `Invalid`), identifies follow-up requirements, and extracts key business intent.

5. **PostgreSQL Data Persistence**:
   - Complete schema tracking customer profiles, call metadata, turn-by-turn transcripts, and AI executive summaries.
   - Automatic fallback to SQLite if PostgreSQL is not active locally.

6. **Next.js Admin Dashboard**:
   - Live metrics (Total Calls, Completed Calls, Failed Calls, Interested Leads, Follow-ups Required, Avg Call Duration).
   - Filter calls by date, customer, status, outcome, lead tier, and follow-up status.
   - Interactive Live Voice Call modal with audio waveform visualizer.

---

## 🛠️ Technology Stack

| Component | Technology | Free / Trial Tier Used |
| :--- | :--- | :--- |
| **Backend** | Python 3.14+, FastAPI, Uvicorn, SQLAlchemy | Open Source |
| **AI / GenAI** | Google Gemini 2.5 Flash (`google-genai`) | Free API Tier |
| **Text-to-Speech (TTS)** | Microsoft Edge Neural TTS (`edge-tts`) | High quality `en-IN-PrabhatNeural` (Free) |
| **Speech-to-Text (STT)**| Web Speech API / Hybrid Audio Transcriber | Browser Native (Free) |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS | Open Source |
| **Database** | PostgreSQL 16 (or SQLite fallback) | Local / Free PostgreSQL |
| **Telephony** | Twilio Voice REST API / WebRTC Simulation | Twilio Trial / WebRTC Browser Mode |

---

## 📁 Repository Structure

```
SERP Hawk/
├── backend/
│   ├── app/
│   │   ├── agent/
│   │   │   ├── agent_engine.py         # Agentic AI slot decision engine & LLM prompts
│   │   │   ├── context_manager.py      # Session state & slot tracker
│   │   │   └── summary_generator.py    # Post-call GenAI lead summary & scoring
│   │   ├── voice/
│   │   │   ├── tts_service.py          # Edge Neural TTS voice generator
│   │   │   └── stt_service.py          # Speech-to-Text transcription handler
│   │   ├── telephony/
│   │   │   └── twilio_service.py       # Twilio REST API & TwiML stream handler
│   │   ├── routers/
│   │   │   ├── customers.py            # Customer CRUD endpoints
│   │   │   ├── calls.py                # Call initiation & history filters
│   │   │   ├── stats.py                # Dashboard analytics
│   │   │   └── websocket.py            # 2-way real-time voice WebSocket endpoint
│   │   ├── config.py                   # App settings & env variables
│   │   ├── database.py                 # PostgreSQL & SQLite fallback session
│   │   ├── models.py                   # SQLAlchemy models
│   │   ├── schemas.py                  # Pydantic schemas
│   │   └── main.py                     # FastAPI application entrypoint
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css             # Glassmorphism theme & animations
│   │   │   └── page.tsx                # Main Admin Dashboard page
│   │   ├── components/
│   │   │   ├── Header.tsx              # Top navigation header
│   │   │   ├── DashboardStats.tsx      # Analytics card grid
│   │   │   ├── CallFilters.tsx         # Search and multi-criteria filters
│   │   │   ├── CallTable.tsx           # Call history table
│   │   │   ├── CustomerTable.tsx       # Customer directory table
│   │   │   ├── CustomerModal.tsx       # New customer campaign modal
│   │   │   ├── LiveCallModal.tsx       # 2-Way Voice Call modal with waveform & slots
│   │   │   └── CallDetailModal.tsx     # Call transcript & AI summary viewer
│   │   ├── lib/
│   │   │   └── api.ts                  # Backend API helper
│   │   └── types/
│   │       └── index.ts                # TypeScript interfaces
│   ├── package.json
│   └── next.config.ts
├── database/
│   ├── schema.sql                      # PostgreSQL DDL script
│   └── seed.sql                        # Seed customer & call demonstration data
└── README.md                           # Documentation
```

---

## 🚀 Step-by-Step Setup Guide

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ai-calling-agent.git
cd ai-calling-agent
```

### 2. Configure Environment Variables
Create `.env` files for backend and root:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Edit `.env`:
```env
# PostgreSQL Database (Fallback to SQLite if PostgreSQL is not active)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/calling_agent
USE_SQLITE_FALLBACK=true

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-2.5-flash

# Telephony (Optional: Twilio Trial Account Credentials)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
SERVER_PUBLIC_URL=http://localhost:8000

# Voice Settings
DEFAULT_TTS_VOICE=en-IN-PrabhatNeural
DEFAULT_STT_LANGUAGE=en-IN
```

### 3. Setup Database (PostgreSQL)
Create PostgreSQL database:
```bash
psql -U postgres -c "CREATE DATABASE calling_agent;"
psql -U postgres -d calling_agent -f database/schema.sql
psql -U postgres -d calling_agent -f database/seed.sql
```
*(Note: If PostgreSQL is not running, the application will automatically initialize and use SQLite `calling_agent.db` without crashing).*

### 4. Run FastAPI Backend
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python app/main.py
```
Backend server will run at: `http://localhost:8000`  
Interactive Swagger API Docs available at: `http://localhost:8000/docs`

### 5. Run Next.js Admin Dashboard
In a new terminal tab:
```bash
cd frontend
npm install
npm run dev
```
Dashboard will run at: `http://localhost:3000`

---

## 📞 How to Start a Test Call

1. Open the Admin Dashboard at `http://localhost:3000`.
2. Click on the **"Customer Directory"** tab.
3. Select any customer (e.g. **Rahul Kumar**) and click **"Start Call"**.
4. The **Live 2-Way Voice Call Modal** will open and connect to the FastAPI WebSocket.
5. The AI agent will greet the customer using neural speech (`en-IN-PrabhatNeural`).
6. Speak into your microphone or type responses (e.g., *"I need a 500 LPH RO system for my hotel in Bangalore with budget around 1 Lakh"*).
7. Watch the **GenAI Agent Slots State** update live in green as information is captured!
8. Click **"End Call"** to finalize the conversation. The AI post-call summarizer will instantly write the lead assessment, transcript, and follow-up flags to PostgreSQL!

---

## 📊 Database Schema Summary

### `customers`
- `id`: PRIMARY KEY
- `name`, `phone_number`, `email`, `company_name`, `purpose`, `product`, `notes`, `created_at`

### `calls`
- `id`: PRIMARY KEY (e.g. `call_demo_001` or Twilio SID)
- `customer_id`: FOREIGN KEY -> `customers.id`
- `phone_number`, `direction`, `status`, `outcome`, `start_time`, `end_time`, `duration_seconds`, `failure_reason`

### `call_transcripts`
- `id`: PRIMARY KEY
- `call_id`: FOREIGN KEY -> `calls.id`
- `speaker` ('AI' | 'CUSTOMER' | 'SYSTEM'), `message`, `confidence`, `timestamp`

### `call_summaries`
- `id`: PRIMARY KEY
- `call_id`: FOREIGN KEY -> `calls.id`
- `customer_name`, `requirement`, `capacity`, `location`, `application`, `budget`, `timeline`
- `lead_status` ('Hot' | 'Warm' | 'Cold' | 'Not Interested' | 'Invalid')
- `follow_up_required` (BOOLEAN), `follow_up_notes`, `key_requirements`, `customer_intent`, `important_points`, `call_outcome`, `summary_text`

---

## ⚡ Free/Trial Tier Disclosures & Limitations

1. **Telephony (Twilio Free Trial)**:
   - Twilio trial accounts require recipient phone numbers to be verified in the Twilio console.
   - To overcome this limitation for seamless testing, HawkAI includes a full **WebRTC / Browser Live Calling Mode** that simulates real telephone calls over WebSockets with full audio synthesis and speech input.
2. **Text-To-Speech (Microsoft Edge Neural)**:
   - Uses `edge-tts` (`en-IN-PrabhatNeural`), providing high-quality Indian English voice synthesis without API costs or rate limits.
3. **GenAI Model**:
   - Powered by Google Gemini 2.5 Flash via standard API key. Includes intelligent fallback state engine if offline.

---

## 🔮 Future Improvements
- Multi-language support (Hindi, Tamil, Telugu, Kannada).
- Outbound campaign bulk CSV import.
- Live human agent takeover switch.
- CRM webhooks (HubSpot, Salesforce integration).
