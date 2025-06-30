import requests
from datetime import datetime, timezone

CURRENTUV_URL = "https://currentuvindex.com/api/v1/uvi"
REQUEST_TIMEOUT = 5  # 5 seconds timeout

def get_uv_index(ctx):
    lat, lon = ctx["lat"], ctx["lon"]

    try:
        response = requests.get(CURRENTUV_URL, params={"latitude": lat, "longitude": lon}, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()

        # Current UV data
        now_data = data.get("now", {})
        uv = now_data.get("uvi")
        timestamp = now_data.get("time")
        
        # Calculate max UV for today from forecast data
        max_uv = None
        max_uv_time = None
        forecast_data = data.get("forecast", [])
        if forecast_data:
            # Get today's date in UTC
            today = datetime.now(timezone.utc).date()
            
            # Filter forecast data for today and find max UV
            today_forecast = []
            for entry in forecast_data:
                try:
                    entry_time = datetime.fromisoformat(entry["time"].replace("Z", "+00:00"))
                    if entry_time.date() == today:
                        today_forecast.append((entry["uvi"], entry["time"]))
                except (ValueError, KeyError):
                    continue
            
            if today_forecast:
                # Find the entry with maximum UV
                max_entry = max(today_forecast, key=lambda x: x[0])
                max_uv = max_entry[0]
                max_uv_time = max_entry[1]

        return {
            "source": "currentuvindex.com",
            "uv_index": uv,
            "timestamp": timestamp,
            "max_uv": max_uv,
            "max_uv_time": max_uv_time
        }

    except Exception as e:
        print(f"[ERROR] UV adapter failed for {lat}, {lon}: {e}")
        return None
