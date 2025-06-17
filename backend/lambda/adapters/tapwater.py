import os
import requests

SAFE_COUNTRIES = {
    "Andorra", "Australia", "Austria", "Belgium", "Canada", "Chile", "Croatia",
    "Czechia", "Czech Republic", "Denmark", "Estonia", "Finland", "France", "Germany",
    "Greece", "Hungary", "Iceland", "Ireland", "Israel", "Italy", "Japan",
    "Liechtenstein", "Luxembourg", "Malta", "Monaco", "Netherlands", "New Zealand",
    "Norway", "Poland", "Portugal", "San Marino", "Singapore", "Slovenia", "Spain",
    "Sweden", "Switzerland", "United Kingdom", "United States", "South Korea"
}

OPENCAGE_API_KEY = os.getenv("OPENCAGE_API_KEY")
OPENCAGE_URL = "https://api.opencagedata.com/geocode/v1/json"
REQUEST_TIMEOUT = 5  # 5 seconds timeout

def is_tap_water_safe(ctx):
    lat, lon = ctx["lat"], ctx["lon"]

    if not OPENCAGE_API_KEY:
        raise RuntimeError("Missing OPENCAGE_API_KEY")

    params = {
        "q": f"{lat},{lon}",
        "key": OPENCAGE_API_KEY,
        "no_annotations": 1,
        "language": "en"
    }

    try:
        response = requests.get(OPENCAGE_URL, params=params, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()
        components = data["results"][0]["components"]
        country = components.get("country", "Unknown")
        
        # Debug logging
        print(f"[DEBUG] Tap water check - Country from OpenCage: {country}")
        print(f"[DEBUG] Tap water check - Is country in SAFE_COUNTRIES: {country in SAFE_COUNTRIES}")
        print(f"[DEBUG] Tap water check - Available components: {components}")

        return {
            "source": "opencage+custom",
            "country": country,
            "is_safe": country in SAFE_COUNTRIES
        }

    except Exception as e:
        print(f"[ERROR] Tap water check failed for {lat}, {lon}: {e}")
        return {
            "source": "opencage+custom",
            "country": "Unknown",
            "is_safe": None
        }
