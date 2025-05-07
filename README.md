
# 🩺 Health Exposure App

A mobile-first system for delivering real-time, location-based health risk data (like air quality and UV index).  
This project is structured into a **backend** (AWS Lambda + S3 + CloudFront) and a future **frontend** (React Native).

---

## 🗂 Project Structure

```
health-exposure/
├── backend/          # AWS Lambda backend with caching and fallback
│   ├── lambda/       # Lambda function and OpenWeather adapter
│   ├── scripts/      # CLI tools for local testing and AWS inspection
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md     # Backend-specific docs
├── frontend/         # Placeholder for mobile app (React Native)
│   └── README.md
├── README.md         # Project overview (this file)
```

---

## 🎯 Overview

- 🛰 **Backend**: Provides health data by H3 location using OpenWeather API
- 📦 **Serverless**: Built with AWS Lambda, S3, CloudFront, and API Gateway
- 🔁 **Caching**: Lazy generation with TTL-based refresh (~1h)
- 🛡 **Secure**: Public-read only S3, no public write, no open API keys
- 📱 **Frontend**: Mobile app (coming soon) to visualize and interact with data

---

## 🚀 Setup

To get started with the backend:

```bash
cd backend
docker build --platform linux/amd64 -t health-lambda .
docker run --rm --platform linux/amd64 -v "$PWD":/out --entrypoint bash health-lambda \
  -c "cd /var/task && zip -r /out/lambda_deploy.zip ."

aws lambda update-function-code \
  --function-name health-exposure-fallback \
  --zip-file fileb://lambda_deploy.zip
```

Frontend setup coming soon.

---

## 🔒 Security

This repo is private. Ensure `.env`, API keys, or secrets are **never committed**.

---

## 👤 Author

Built by [Your Name] as part of a professional portfolio in AI & cloud systems.
