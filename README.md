# Health Exposure App

A full-stack mobile application that informs users of their environmental health exposure based on their real-time location. Risk factors include air quality, UV index, pollen count, humidity, and other locally relevant alerts such as water safety and health-related news.

---

## 📱 Frontend

**Built with:** React Native + Expo

### Features:
- Detects user location using `expo-location`
- Displays health exposure data in a traffic-light format (green/yellow/red)
- Tappable rows for details on each category
- Location name shown under header (via backend reverse geocode)
- Mobile-first UI with clean layout
- Optional support for premium tier and history views (in progress)

### Getting Started

```bash
cd frontend
npm install
npx expo start
```

Scan QR code with Expo Go to run on your device.

---

## 🛰 Backend

**Built with:** AWS Lambda (Python) + S3 + CloudFront

### Responsibilities:
- Generates and serves JSON files by H3 cell
- Uses Uber H3 resolution 6 (~1.2 km² granularity)
- Stores cached JSON in S3 (`health-exposure-data/`)
- Serves via Lambda URL or public CloudFront endpoint
- Automatically updates news data via scheduler (every 15 minutes)

### Data Adapters:
- `openweather.py`: air quality (PM2.5, PM10, O₃, CO), humidity
- `uv.py`: UV index (via CurrentUVIndex API)
- `pollen.py`: pollen counts from Open-Meteo (Europe)
- `tapwater.py`: tap water safety (OpenCage country check)
- `opencage.py`: reverse geocoding
- `newsdata.py`: health/safety news (optional)

### Scheduler:
- Runs every 15 minutes via CloudWatch Events
- Checks all cells for news data older than 6 hours
- Updates up to 10 oldest cells per run
- Prioritizes cells with the oldest news first
- Staggers updates throughout the day to distribute load

### Example API Usage:

```http
GET /cells?lat=60.17&lon=24.93
```

Returns JSON like:

```json
{
  "h3_cell": "85283473fffffff",
  "location": "Helsinki, Finland",
  "last_updated": 1746720000,
  "data": {
    "air_quality": { ... },
    "uv": { ... },
    "pollen": { ... },
    "humidity": { ... },
    "tap_water": { ... }
  },
  "news": {
    "fetched_at": "...",
    "articles": [ ... ]
  }
}
```

---

## 🔄 Deployment

### Backend CI/CD
- AWS Lambda deployed automatically via GitHub Actions
- Docker used for native dependency packaging (e.g. `h3` for x86_64 Lambda)

### Frontend
- Expo managed
- Deployed manually via Expo Go or `eas build` (future)

---

## 🔐 API Keys & Environment

Required environment variables:

```
OPENWEATHER_API_KEY=
OPENCAGE_API_KEY=
NEWSDATA_API_KEY=
S3_BUCKET=health-exposure-data
```

Set these in the AWS Lambda environment config and `.env` locally as needed.

---

## 🛣 Roadmap

- Add refresh & pull-to-refresh
- Add exposure history / graphs
- Simulate premium tiers (shorter TTL, more detail)
- Display health-related news (optional)
- Add local alerts for disasters, smoke, or water quality

---

## 📁 Repo Structure

```
health-exposure/
├── backend/
│   ├── lambda/
│   │   ├── lambda_function.py
│   │   └── adapters/
│   └── Dockerfile
├── frontend/
│   ├── App.js
│   ├── components/
│   └── screens/
└── README.md
```