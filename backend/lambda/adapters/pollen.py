import requests

OPEN_METEO_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
REQUEST_TIMEOUT = 5  # 5 seconds timeout

def get_pollen(ctx):
    lat, lon = ctx["lat"], ctx["lon"]

    try:
        response = requests.get(OPEN_METEO_URL, params={
            "latitude": lat,
            "longitude": lon,
            "hourly": ",".join([
                "alder_pollen", "birch_pollen", "grass_pollen",
                "mugwort_pollen", "olive_pollen", "ragweed_pollen"
            ]),
            "timezone": "auto"
        }, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()

        pollen_data = data.get("hourly", {})
        time_index = 0  # take the first hourly data point

        return {
            "source": "open-meteo",
            "alder": pollen_data.get("alder_pollen", [None])[time_index],
            "birch": pollen_data.get("birch_pollen", [None])[time_index],
            "grass": pollen_data.get("grass_pollen", [None])[time_index],
            "mugwort": pollen_data.get("mugwort_pollen", [None])[time_index],
            "olive": pollen_data.get("olive_pollen", [None])[time_index],
            "ragweed": pollen_data.get("ragweed_pollen", [None])[time_index],
            "timestamp": pollen_data.get("time", [None])[time_index]
        }

    except Exception as e:
        print(f"[ERROR] Pollen adapter failed for {lat}, {lon}: {e}")
        return None
