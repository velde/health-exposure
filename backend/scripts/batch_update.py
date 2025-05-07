import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# lambda/batch_update.py

import os
import json
import boto3
import h3
from dotenv import load_dotenv
from adapters import openweather
from math import radians, cos, sin, sqrt, atan2

load_dotenv()

s3 = boto3.client("s3")
BUCKET = "health-exposure-data"
H3_RES = 6

# Center + radius-based region (e.g. Helsinki, ~30km)
CENTER_LAT = 60.1695
CENTER_LON = 24.9354
RADIUS_KM = 30  # Approximate radius

def generate_h3_cells(center_lat, center_lon, radius_km, resolution):
    """Generates H3 cells in a circular area around a point."""
    center_cell = h3.geo_to_h3(center_lat, center_lon, resolution)
    return h3.k_ring(center_cell, h3.k_ring_distances(radius_km, resolution))

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))

def batch_update():
    center_cell = h3.geo_to_h3(CENTER_LAT, CENTER_LON, H3_RES)
    nearby_cells = h3.k_ring(center_cell, 25)  # ~30km for H3_RES 6

    print(f"[INFO] Found {len(nearby_cells)} cells around center.")

    for cell in nearby_cells:
        lat, lon = h3.cell_to_latlng(cell)
        print(f"[INFO] Processing {cell} at ({lat:.4f}, {lon:.4f})")

        data = {"h3": cell, "lat": lat, "lon": lon}
        air = openweather.get_air_quality(lat, lon)

        if not air:
            print(f"[WARN] Skipping {cell} (no data)")
            continue

        data["air_quality"] = air

        key = f"cells/{cell}.json"
        s3.put_object(
            Bucket=BUCKET,
            Key=key,
            Body=json.dumps(data, indent=2),
            ContentType="application/json"
        )
        print(f"[UPLOAD] s3://{BUCKET}/{key}")

if __name__ == "__main__":
    batch_update()
