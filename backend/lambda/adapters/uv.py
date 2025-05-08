
import requests

CURRENTUV_URL = "https://currentuvindex.com/api/v1/uvi"

def get_uv_index(ctx):
    lat, lon = ctx["lat"], ctx["lon"]

    try:
        response = requests.get(CURRENTUV_URL, params={"latitude": lat, "longitude": lon})
        response.raise_for_status()
        data = response.json()

        return {
            "source": "currentuvindex.com",
            "uv_index": data.get("uv_index"),
            "timestamp": data.get("timestamp")
        }

    except Exception as e:
        print(f"[ERROR] UV adapter failed for {lat}, {lon}: {e}")
        return None
