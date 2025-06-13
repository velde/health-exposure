# Health Exposure – Frontend

A mobile-first React Native app (Expo) that displays local environmental risk factors such as air quality, UV index, pollen, and humidity.

## Features

- Detects user location using `expo-location`
- Shows risk levels with traffic-light color scheme
- Tappable rows open detail screens for each metric
- Displays resolved location name (from backend)
- Location search functionality
- News article display and details

## Getting Started

```bash
cd frontend
npm install
npx expo start
```

Scan QR code using Expo Go to preview the app on your device.

## Tech Stack

- React Native with Expo
- React Navigation
- Location & Permissions via `expo-location`
- Fetches health data from AWS Lambda backend

## Local Development

- Works with real backend URLs
- Supports running on iOS/Android simulators and physical devices
- All health data comes from H3-indexed backend API (`/cells?lat=...&lon=...`)

## Folder Structure

```
frontend/
├── App.js              # Main application component
├── components/         # Reusable components
│   ├── RiskRow.js     # Risk level display component
│   └── NewsCard.js    # News article card component
├── screens/           # Screen components
│   ├── DetailScreen.js           # Detailed view of risk factors
│   ├── LocationSearchScreen.js   # Location search interface
│   └── NewsDetailScreen.js       # News article details
├── assets/            # Static assets and images
├── app.json          # Expo configuration
└── babel.config.js   # Babel configuration
```

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](../LICENSE) file for details.