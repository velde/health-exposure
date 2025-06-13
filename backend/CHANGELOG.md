
# CHANGELOG – Health Exposure Backend

All notable changes and milestones to this backend will be documented here.

---

## Milestone: Backend v1 Deployment (2025-05-08)

**Summary:**  
The backend for the Health Exposure app is now fully operational, automated, and production-ready. This marks the completion of the backend v1 milestone.

---

### Key Features Implemented

- **Serverless Backend** with AWS Lambda, S3, API Gateway, and CloudFront
- **Location-based health data** generated lazily by H3 index using OpenWeather API
- **TTL logic (1 hour)** to ensure data freshness and prevent API overuse
- **CloudFront caching** with `Cache-Control: max-age=3600`
- **S3 metadata (`last_updated`)** added for lightweight freshness checks
- **CI/CD Pipeline** via GitHub Actions:
  - On push to `main`: rebuilds Lambda ZIP via Docker, deploys, and invalidates CloudFront
- **Security & Cost Control**:
  - Public read-only S3
  - API Gateway authorized to invoke Lambda only
  - Lambda environment variables used for secrets
- **Error handling** for invalid H3 indexes, S3 fetch errors, and upstream API failures

---

### Confirmed Deploy Artifacts

- `lambda_deploy.zip` created with:
  - Native `h3` build for x86_64
  - `lambda_function.py` + `adapters/openweather.py`
- Object uploaded to S3:
  - `CacheControl: max-age=3600`
  - `Metadata: last_updated = <timestamp>`
  - `ContentType: application/json`

---

### Next Steps

- [ ] Begin scaffolding the mobile frontend (React Native + H3)
- [ ] Add additional adapters (e.g. UV index, pollen)
- [ ] Optional: Setup monitoring, observability, and WAF rate limiting
