# TrainDesk (MERN Stack)

A full-stack MERN (MongoDB, Express, React, Node.js) training schedule and attendance management console styled with a minimalist, high-legibility Cyberpunk-Matte Helvetica aesthetic.

---

## 🚀 Features & Architecture

### Phase 1: Architecture & Directory Structure
```
traindesk-mern/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection (mongoose + MongoMemoryServer fallback)
│   │   ├── models/          # Mongoose schemas (Person, Trainer, Trainee, Session, Booking)
│   │   ├── controllers/     # ScheduleController, TrainerController, SessionController
│   │   ├── routes/          # REST API endpoints (/api/trainers, /api/schedules, /api/sessions)
│   │   ├── services/        # DailySummaryGenerator & DetailedSummaryGenerator
│   │   ├── utils/           # Schedule gap calculation & overlap clash detection
│   │   └── seed.js          # Database Seeder (3 trainers, 22 sessions, mock trainees)
│   ├── package.json
│   └── server.js            # Express application entry point & static SPA hosting
├── frontend/
│   ├── src/
│   │   ├── components/      # DayStrip, WeekHeatMap, DailyBriefing, SessionList, SessionCard, TrainerPicker
│   │   ├── services/        # Axios API client
│   │   ├── utils/           # Time and duration formatters
│   │   ├── App.jsx          # State coordinator
│   │   ├── main.jsx
│   │   └── index.css        # Matte palette UI styling
│   ├── package.json
│   └── vite.config.js       # Vite configuration with API proxy
├── Dockerfile               # Multi-stage production container build
├── docker-compose.yml       # 1-command containerized stack with MongoDB
└── README.md
```

### Phase 2: MongoDB Schemas (UML Diagram Conformance)
- **Person (Base Schema)**: `name`, `email`, `phone`.
- **Trainer (Discriminator extending Person)**: `trainerId` (unique), `specialization`.
- **Trainee (Discriminator extending Person)**: `traineeId`, `organization`.
- **TrainingSession**: `sessionId` (unique), `trainerId` (ref Trainer), `topic`, `date`, `startTime`, `endTime`, `room`, `capacity`.
  - Methods: `seatsLeft()`, `isFull()`, `overlapsWith(otherSession)`.
- **Booking**: `bookingId` (unique), `sessionId` (ref TrainingSession), `traineeId` (ref Trainee), `bookedAt`, `status` (`CONFIRMED`, `CANCELLED`, `WAITLISTED`), `notes`.

### Phase 3: Business Logic & Summary Generators
- **`scheduleUtils.js`**:
  - `calculateGaps(sessions)`: Computes free windows between sessions (minimum 30 mins).
  - `checkOverlaps(sessions)`: Detects time clashes across concurrent sessions.
- **`DailySummaryGenerator`**:
  - Builds natural language daily lead summaries.
  - Generates stat counters (`bstats`: sessions count, total booked trainees, start/end times, clash alerts).
  - Computes timeline block positions (`btl`) with non-overlapping lane allocation.
  - Generates agenda list with state badges (`In progress`, `Next up`, `Full`, `X waitlisted`, `Clash`).
  - Emits warning and free window chips.
- **`DetailedSummaryGenerator`**:
  - Compiles comprehensive attendee rosters with trainee name, organization, booking timestamps, and status.
- **`seed.js`**:
  - Automatically seeds 3 trainers, 22 sessions, and 30 mock trainees with real organization affiliations.
  - Automatically runs on server startup if the database is empty!

### Phase 4: Express REST API Endpoints
- `GET /api/trainers` — Fetch all registered trainers.
- `GET /api/schedules/dashboard?trainerId={id}&dayOffset={offset}&date={date}` — Returns the daily sessions, text briefing, bstats, timeline blocks, chips, and 7-day strip status.
- `GET /api/schedules/heatmap?trainerId={id}` — Returns the 7-day × 11-hour intensity matrix (`l1`, `l2`, `l3`) with clash markers.
- `GET /api/sessions/:sessionId/attendees` — Fetches the detailed trainee roster table for a specific session.
- `POST /api/seed` — Re-seeds prototype data.
- `GET /api/health` — Service health check.

### Phase 5: Modular React + Vite Frontend
- **TrainerPicker**: Dropdown trainer selector displaying trainer name and specializations.
- **DayStrip**: Horizontal scrollable day strip showing 7 days (Today, Tomorrow, etc.) with session badges.
- **DailyBriefing**: Eyebrow date, statement heading, statistic counters, visual timeline bar with lane allocation, agenda list, and status chips.
- **WeekHeatMap**: 7-day × 11-hour grid with interactive row selector, intensity colors (`l1`, `l2`, `l3`), and conflict borders.
- **SessionList & SessionCard**: Session duration markers, capacity progress bars, and expandable trainee roster tables (`<details><summary>`).

---

## 💻 Quick Start & Running Locally

### 1. Install Dependencies
```bash
# In backend
cd backend
npm install

# In frontend
cd ../frontend
npm install
```

### 2. Run Database Seeder (Optional, backend auto-seeds on start)
```bash
npm run seed --prefix backend
```

### 3. Start Backend & Frontend
**Terminal 1 (Backend - Port 5000):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend - Port 3000):**
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> Note: If no local MongoDB is detected on `mongodb://127.0.0.1:27017`, the backend automatically launches an embedded in-memory MongoDB instance via `mongodb-memory-server` and seeds it automatically. You don't need to manually configure MongoDB to test the app!

---

## 🐳 Docker Deployment

To launch the full production stack with MongoDB in a single command:
```bash
docker-compose up --build
```
Access the application at [http://localhost:5000](http://localhost:5000).

