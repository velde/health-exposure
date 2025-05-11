# Health Exposure – Frontend

A mobile-first React Native app (Expo) that displays local environmental risk factors such as air quality, UV index, pollen, and humidity.

---

## 🚀 Features

- 📍 Detects user location using `expo-location`
- 📊 Shows risk levels with traffic-light color scheme
- 🧾 Tappable rows open detail screens for each metric
- 🗺 Displays resolved location name (from backend)
- 🔐 Planned: premium tier support, history views

---

## 🛠 Getting Started

```bash
cd frontend
npm install
npx expo start
```

Scan QR code using Expo Go to preview the app on your device.

---

## 📦 Tech Stack

- React Native with Expo
- React Navigation
- Location & Permissions via `expo-location`
- Fetches health data from AWS Lambda backend

---

## 🧪 Local Development

- Works with real backend URLs
- Supports running on iOS/Android simulators and physical devices
- All health data comes from H3-indexed backend API (`/cells?lat=...&lon=...`)

---

## 📁 Folder Structure

```
frontend/
├── App.js
├── components/
│   └── RiskRow.js
├── screens/
│   └── DetailScreen.js
└── README.md
```