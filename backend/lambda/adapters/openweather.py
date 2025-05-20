import os
import requests

API_KEY = os.getenv("OPENWEATHER_API_KEY")
BASE_URL = "https://api.openweathermap.org/data/2.5/air_pollution"
REQUEST_TIMEOUT = 5  # 5 seconds timeout

def get_air_quality(ctx):
    lat, lon = ctx["lat"], ctx["lon"]

    if not API_KEY:
        raise RuntimeError("Missing OPENWEATHER_API_KEY")

    params = {
        "lat": lat,
        "lon": lon,
        "appid": API_KEY,
    }

    try:
        response = requests.get(BASE_URL, params=params, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()

        aqi = data["list"][0]["main"]["aqi"]
        components = data["list"][0]["components"]

        return {
            "source": "openweathermap",
            "aqi": aqi,
            "pm2_5": components.get("pm2_5"),
            "pm10": components.get("pm10"),
            "o3": components.get("o3"),
            "co": components.get("co"),
            "timestamp": data["list"][0]["dt"]
        }

    except Exception as e:
        print(f"[ERROR] OpenWeather API failed for {lat}, {lon}: {e}")
        return None
