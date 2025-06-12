# Health Exposure Web Frontend

A modern web application built with React, TypeScript, and Vite that displays environmental health data for any location.

## Features

- **Location Search**: Search and select any location using OpenStreetMap's Nominatim service
- **Environmental Data Display**:
  - Air Quality (AQI, PM2.5, PM10, O3)
  - UV Index with color-coded severity
  - Tap Water safety and country information
  - Humidity levels with timestamps
  - Detailed Pollen information (Alder, Birch, Grass, Mugwort, Olive, Ragweed)
  - Local health news (when available)
- **Real-time Updates**: Data is fetched from the Health Exposure API
- **Responsive Design**: Works on both desktop and mobile devices

## Tech Stack

- React 18
- TypeScript
- Vite
- Chakra UI for components
- React Query for data fetching
- React Router for navigation
- Axios for API requests

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   cd web
   npm install
   ```

3. Create a `.env` file in the `web` directory with:
   ```
   VITE_API_URL=https://dokrd0asw0.execute-api.eu-north-1.amazonaws.com
   VITE_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Structure

```
web/
├── src/
│   ├── api/          # API client and types
│   ├── components/   # Reusable components
│   ├── screens/      # Page components
│   ├── App.tsx       # Main app component
│   └── main.tsx      # Entry point
├── public/           # Static assets
└── index.html        # HTML template
```

## API Integration

The web frontend integrates with the Health Exposure API to fetch environmental data. The API requires:
- API key for authentication
- Latitude and longitude coordinates
- Proper CORS configuration

## Deployment

The application is automatically deployed to Vercel when changes are pushed to the main branch. The production URL is:
https://web-iota-one-12.vercel.app

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT
