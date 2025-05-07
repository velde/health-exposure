
# 🌍 Health Exposure Backend

This is the backend service for the **Health Exposure** mobile app, which delivers location-based health risk data (air quality, UV, etc.) using geospatial H3 indexing and a lazy caching strategy. Data is served through AWS S3 and accelerated via CloudFront, with fallback generation handled by an AWS Lambda function.

---

## 🎯 Project Goals

- Provide accurate, location-specific health exposure data
- Cache by H3 cell using S3 and CloudFront
- Lazy-generate data on-demand via Lambda fallback
- Use TTL (1 hour) to refresh stale data
- Stay low-cost, fast, and scalable (serverless design)

---

## 🧱 Project Structure

```
health-exposure-backend/
├── lambda/
│   ├── lambda_function.py         # Main Lambda handler
│   └── adapters/
│       └── openweather.py         # OpenWeatherMap integration
├── scripts/
│   ├── generate_data.py           # CLI script to fetch data for a point
│   ├── batch_update.py            # CLI script to upload multiple H3 cells
│   └── check_aws_health_backend.py  # CLI audit of AWS settings
├── requirements.txt
├── Dockerfile                     # Builds deployable Lambda package (linux/amd64)
```

---

## 🌐 APIs Used

| Risk Type    | API Source             | Notes                         |
|--------------|------------------------|-------------------------------|
| Air Quality  | OpenWeatherMap         | Global air pollution data     |
| UV Index     | (planned)              | OpenUV or OpenWeatherMap      |
| Others       | (future)               | Pollen, noise, water, etc.    |

---

## 🛰️ How It Works

### 1. Client Request
- Mobile app sends request for data at lat/lon
- App either:
  - Computes H3 cell locally and hits CDN:  
    `https://cdn.health-exposure.app/cells/{h3_id}.json`
  - OR calls Lambda directly via Function URL or API Gateway

### 2. CloudFront + S3
- If file exists in S3, CloudFront serves it instantly
- If missing or expired, CloudFront triggers fallback route

### 3. Lambda Fallback
- API Gateway receives request: `/cells/fallback/{h3_id}`
- Lambda:
  - Validates H3 index
  - Converts to lat/lon
  - Fetches fresh data
  - Saves to S3 with `last_updated`
  - Returns JSON payload

---

## 🔐 Security

- ✅ S3 bucket is public-read **only**
- ✅ Lambda uses environment variable for API key
- ✅ TTL logic prevents unnecessary API usage
- ⚠️ Function URL is public (consider rate-limiting)
- ✅ `scripts/check_aws_health_backend.py` audits security

---

## 🛠 Deployment

### Build Lambda package
```bash
docker build --platform linux/amd64 --no-cache -t health-lambda .
docker run --rm --platform linux/amd64 -v "$PWD":/out --entrypoint bash health-lambda \
  -c "cd /var/task && zip -r /out/lambda_deploy.zip ."
```

### Deploy to AWS
```bash
aws lambda update-function-code \
  --function-name health-exposure-fallback \
  --zip-file fileb://lambda_deploy.zip
```

---

## 📦 GitHub Structure

This repo is currently **private** and intended for personal portfolio/demo purposes.

- ✅ Lambda is production-ready
- ✅ Scripts allow local testing and S3 updates
- ✅ Project supports CI/CD pipeline (optional)
