# Health Exposure – Backend

Serverless Python backend that computes environmental risk data per H3 cell and serves JSON files through AWS Lambda and S3.

---

## 🌐 API Overview

### Endpoint:
```
GET /cells?lat=60.17&lon=24.93
```

### Response Example:
```json
{
  "h3_cell": "85283473fffffff",
  "location": "Helsinki, Finland",
  "last_updated": 1746720000,
  "data": {
    "air_quality": { ... },
    "pollen": { ... },
    "humidity": { ... },
    "tap_water": { ... },
    "uv": { ... }
  },
  "news": {
    "fetched_at": "...",
    "articles": [ ... ]
  }
}
```

---

## 🛠 Components

- **lambda_function.py** – main handler for generation and retrieval
- **scheduler_function.py** – automated news data updates
- **adapters/** – one module per data source:
  - `openweather.py`: air quality, humidity
  - `uv.py`: UV index
  - `pollen.py`: pollen forecast
  - `tapwater.py`: tap water safety by country
  - `opencage.py`: reverse geocode + country name
  - `newsdata.py`: optional health-related news

---

## 🪄 Behavior

- Uses Uber H3 resolution 6
- On first access, generates JSON and saves to S3
- On subsequent calls, serves JSON unless TTL expired
- Each adapter is modular and optionally TTL-aware
- News data automatically updated via CloudWatch scheduler:
  - Runs every 15 minutes
  - Updates up to 10 oldest cells per run
  - Prioritizes cells with news older than 6 hours
  - Staggers updates to distribute load

---

## 🔄 Deployment

- AWS Lambda, deployed via GitHub Actions
- Uses x86_64 Docker build for native Python packages
- JSON files saved to S3 and optionally served via CloudFront
- CloudWatch Event Rule triggers scheduler every 15 minutes

---

## 📁 Folder Structure

```
backend/
├── lambda/
│   ├── lambda_function.py
│   ├── scheduler_function.py
│   └── adapters/
├── Dockerfile
├── deploy.sh (optional)
└── README.md
```