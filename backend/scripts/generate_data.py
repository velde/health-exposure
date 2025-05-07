import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# lambda/generate_data.py

import os
import json
import boto3
import h3
from dotenv import load_dotenv
from adapters import openweather
from pathlib import Path

# Load .env from project root
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

s3 = boto3.client("s3")
BUCKET = "health-exposure-data"

# Define your H3 resolution and a list of sample H3 cells (expand as needed)
H3_RES = 6
TEST_CELLS = [
    h3.latlng_to_cell(60.1695, 24.9354, H3_RES),  # Helsinki
    h3.latlng_to_cell(52.5200, 13.4050, H3_RES),  # Berlin
    h3.latlng_to_cell(40.7128, -74.0060, H3_RES), # New York
]

def generate_and_upload(cell):
    lat, lon = h3.cell_to_latlng(cell)
    print(f"[INFO] Processing cell {cell} ({lat:.4f}, {lon:.4f})")

    data = {
        "h3": cell,
        "lat": lat,
        "lon": lon,
    }

    air_data = openweather.get_air_quality(lat, lon)
    if air_data:
        data["air_quality"] = air_data
    else:
        print(f"[WARN] Skipping cell {cell} due to missing air data.")
        return

    key = f"cells/{cell}.json"
    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=json.dumps(data, indent=2),
        ContentType="application/json",
    )
    print(f"[UPLOAD] s3://{BUCKET}/{key}")

if __name__ == "__main__":
    for cell in TEST_CELLS:
        generate_and_upload(cell)
