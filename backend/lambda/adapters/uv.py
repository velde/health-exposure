import requests

CURRENTUV_URL = "https://currentuvindex.com/api/v1/uvi"
REQUEST_TIMEOUT = 5  # 5 seconds timeout

def get_uv_index(ctx):
    lat, lon = ctx["lat"], ctx["lon"]

    try:
        response = requests.get(CURRENTUV_URL, params={"latitude": lat, "longitude": lon}, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()

        uv = data.get("now", {}).get("uvi")
        timestamp = data.get("now", {}).get("time")

        return {
            "source": "currentuvindex.com",
            "uv_index": uv,
            "timestamp": timestamp
        }

    except Exception as e:
        print(f"[ERROR] UV adapter failed for {lat}, {lon}: {e}")
        return None
