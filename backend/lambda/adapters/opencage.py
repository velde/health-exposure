import os
import requests

OPENCAGE_KEY = os.getenv("OPENCAGE_API_KEY")

def reverse_geocode(lat, lon):
    if not OPENCAGE_KEY:
        raise RuntimeError("Missing OPENCAGE_API_KEY")

    url = "https://api.opencagedata.com/geocode/v1/json"
    params = {
        "key": OPENCAGE_KEY,
        "q": f"{lat},{lon}",
        "no_annotations": 1,
        "language": "en"
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        results = response.json().get("results", [])
        if not results:
            return "Unknown Location"

        components = results[0].get("components", {})
        city = components.get("city") or components.get("town") or components.get("village") or components.get("municipality")
        country = components.get("country")
        if city and country:
            return f"{city}, {country}"
        elif country:
            return country
        return "Unknown Location"
    except Exception as e:
        print(f"[ERROR] OpenCage reverse geocoding failed for {lat},{lon}: {e}")
        return "Unknown Location"