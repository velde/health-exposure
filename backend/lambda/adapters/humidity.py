import os
import requests

API_KEY = os.getenv("OPENWEATHER_API_KEY")
CURRENT_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
REQUEST_TIMEOUT = 5  # 5 seconds timeout

def get_humidity(ctx):
    lat, lon = ctx["lat"], ctx["lon"]

    if not API_KEY:
        raise RuntimeError("Missing OPENWEATHER_API_KEY")

    params = {
        "lat": lat,
        "lon": lon,
        "appid": API_KEY
    }

    try:
        response = requests.get(CURRENT_WEATHER_URL, params=params, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()
        humidity = data.get("main", {}).get("humidity")
        timestamp = data.get("dt")

        return {
            "source": "openweathermap",
            "humidity": humidity,
            "timestamp": timestamp
        }

    except Exception as e:
        print(f"[ERROR] Humidity adapter failed for {lat}, {lon}: {e}")
        return None
