
import os
import requests

API_KEY = os.getenv("OPENWEATHER_API_KEY")
ONECALL_URL = "https://api.openweathermap.org/data/2.5/onecall"

def get_uv_index(ctx):
    lat, lon = ctx["lat"], ctx["lon"]

    if not API_KEY:
        raise RuntimeError("Missing OPENWEATHER_API_KEY")

    params = {
        "lat": lat,
        "lon": lon,
        "exclude": "minutely,hourly,daily,alerts",
        "appid": API_KEY
    }

    try:
        response = requests.get(ONECALL_URL, params=params)
        response.raise_for_status()
        data = response.json()
        current = data.get("current", {})
        return {
            "source": "openweathermap",
            "uv_index": current.get("uvi"),
            "timestamp": current.get("dt")
        }
    except Exception as e:
        print(f"[ERROR] UV adapter failed for {lat}, {lon}: {e}")
        return None
