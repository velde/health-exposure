# Health Exposure – Frontend

A mobile app built with React Native and Expo to display real-time health exposure risks like air quality, UV index, humidity, and pollen based on your location.

## 🔧 Tech Stack

- React Native (Expo)
- Navigation: React Navigation
- Location: expo-location
- Backend: AWS Lambda API (GET /cells?lat=...&lon=...)

## 🚀 Getting Started

```bash
npm install
npx expo start
```

Scan the QR code with [Expo Go](https://expo.dev/client) on your phone.

## 📦 Features

- Auto-detects device location
- Fetches real health risk data
- Color-coded traffic-light UI
- Tap to view details for each category

## 🔐 Secrets

No secrets are committed. Ensure you do **not** store `.env` or tokens in this repo.

## 📁 Folder Structure

- `App.js` – Main app logic and navigation
- `components/` – Reusable UI components
- `screens/` – Detail views
- `utils/` – (optional future additions)