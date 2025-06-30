import os
import requests

API_KEY = os.getenv("OPENWEATHER_API_KEY")
CURRENT_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
REQUEST_TIMEOUT = 5  # 5 seconds timeout

def get_weather(ctx):
    lat, lon = ctx["lat"], ctx["lon"]

    if not API_KEY:
        raise RuntimeError("Missing OPENWEATHER_API_KEY")

    params = {
        "lat": lat,
        "lon": lon,
        "appid": API_KEY,
        "units": "metric"  # Use metric units for temperature
    }

    try:
        response = requests.get(CURRENT_WEATHER_URL, params=params, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()
        
        main = data.get("main", {})
        weather = data.get("weather", [{}])[0] if data.get("weather") else {}
        wind = data.get("wind", {})
        clouds = data.get("clouds", {})
        sys = data.get("sys", {})

        return {
            "source": "openweathermap",
            "temperature": {
                "current": main.get("temp"),
                "feels_like": main.get("feels_like"),
                "min": main.get("temp_min"),
                "max": main.get("temp_max")
            },
            "humidity": main.get("humidity"),
            "pressure": main.get("pressure"),
            "wind": {
                "speed": wind.get("speed"),
                "direction": wind.get("deg")
            },
            "weather": {
                "description": weather.get("description"),
                "icon": weather.get("icon"),
                "main": weather.get("main")
            },
            "clouds": clouds.get("all"),
            "visibility": data.get("visibility"),
            "sunrise": sys.get("sunrise"),
            "sunset": sys.get("sunset"),
            "timestamp": data.get("dt")
        }

    except Exception as e:
        print(f"[ERROR] Weather adapter failed for {lat}, {lon}: {e}")
        return None

# Keep the old function for backward compatibility
def get_humidity(ctx):
    weather_data = get_weather(ctx)
    if weather_data:
        return {
            "source": "openweathermap",
            "humidity": weather_data["humidity"],
            "timestamp": weather_data["timestamp"]
        }
    return None
