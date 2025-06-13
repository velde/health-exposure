# Health Exposure App

A full-stack application that informs users of their environmental health exposure based on their real-time location. Risk factors include air quality, UV index, pollen count, humidity, and other locally relevant alerts such as water safety and health-related news.

---

## Mobile Frontend

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

## Web Frontend

**Built with:** React + TypeScript + Vite + Chakra UI

### Features:
- Modern, responsive web interface
- Location search using OpenStreetMap's Nominatim
- Detailed environmental data display:
  - Air Quality (AQI, PM2.5, PM10, O3)
  - UV Index with color-coded severity
  - Tap Water safety and country information
  - Humidity levels with timestamps
  - Detailed Pollen information
  - Local health news
- Real-time data updates
- Mobile-friendly design

### Getting Started

```bash
cd web
npm install
npm run dev
```

Visit `http://localhost:5173` to view the app.

---

## Backend

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

### API Usage

The API accepts both coordinate-based and H3 cell-based requests:

1. **Coordinate-based request**:
   ```
   GET /api/environmental?lat=61.4978&lon=23.7610
   ```

2. **H3 cell-based request**:
   ```
   GET /api/environmental/{h3_id}
   ```

#### Headers
- `x-user-tier`: Optional. Set to "premium" for higher rate limits. Defaults to "free".
- `x-api-key`: Required for third-party access. Contact for API key.
- `force_refresh`: Optional query parameter. Set to "true" to bypass cache.

#### Security
The API implements several security measures:
- CORS protection (only allows requests from authorized origins)
- Simple API key authentication for third-party access
- Rate limiting to prevent abuse
- Input validation for all parameters
- Security event logging and monitoring

#### Monitoring
The system includes comprehensive monitoring:
- Error rate alerts (threshold: 5% in 5 minutes)
- Request rate monitoring (threshold: 100 requests per 5 minutes)
- Cost monitoring (threshold: $2 per day)
- Security event logging and alerts
  - Invalid API key attempts
  - Unauthorized origin attempts
  - Rate limit violations

#### Rate Limiting
The API implements rate limiting to ensure fair usage:
- Free tier: 100 requests per hour
- Premium tier: 1000 requests per hour

Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Maximum requests allowed per hour
- `X-RateLimit-Remaining`: Remaining requests in current hour
- `X-RateLimit-Reset`: Unix timestamp when the rate limit resets

When rate limit is exceeded, the API returns a 429 status code with details about when the limit will reset.

#### Response Format

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

### For Developers
The API is available for third-party use with the following requirements:
1. Valid API key (contact for access)
2. Compliance with rate limits
3. Proper attribution

Example usage with API key:
```bash
curl -H "x-api-key: YOUR_API_KEY" \
     -H "x-user-tier: premium" \
     "https://api.health-exposure.app/environmental?lat=61.4978&lon=23.7610"
```

---

## Deployment

### Backend CI/CD
- AWS Lambda deployed automatically via GitHub Actions
- Docker used for native dependency packaging (e.g. `h3` for x86_64 Lambda)

### Frontend
- Expo managed
- Deployed manually via Expo Go or `eas build` (future)

---

## API Keys & Environment

Required environment variables:

```
OPENWEATHER_API_KEY=
OPENCAGE_API_KEY=
NEWSDATA_API_KEY=
S3_BUCKET=health-exposure-data
HEALTH_EXPOSURE_API_KEY=  # For third-party API access
```

Set these in the AWS Lambda environment config and `.env` locally as needed.

---

## Roadmap

- Add refresh & pull-to-refresh
- Add exposure history / graphs
- Simulate premium tiers (shorter TTL, more detail)
- Display health-related news (optional)
- Add local alerts for crime, disasters, etc.

---

## Repo Structure

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
├── web/
│   ├── src/
│   │   ├── App.tsx
└── README.md
```