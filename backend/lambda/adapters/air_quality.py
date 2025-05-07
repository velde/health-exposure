import requests

def get_air_quality(lat, lon):
    print(f"Calling OpenAQ API for coordinates: lat={lat}, lon={lon}")

    try:
        url = f"https://api.openaq.org/v2/latest?coordinates={lat},{lon}&radius=5000"
        response = requests.get(url)
        print(f"API status code: {response.status_code}")

        response.raise_for_status()
        data = response.json()
        print("API call successful.")

        if not data["results"]:
            print("No results found.")
            return None

        measurements = data["results"][0]["measurements"]
        pm25 = next((m["value"] for m in measurements if m["parameter"] == "pm25"), None)
        print(f"Extracted PM2.5 value: {pm25}")
        return pm25

    except Exception as e:
        print(f"Error fetching or parsing air quality data: {e}")
        return None
