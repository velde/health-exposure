
import json
import boto3
import os
import time
from datetime import datetime, timezone
from adapters.openweather import get_air_quality
from adapters.tapwater import is_tap_water_safe
from adapters.uv import get_uv_index
from adapters.humidity import get_humidity
from adapters.pollen import get_pollen
from adapters.opencage import reverse_geocode
import h3

s3 = boto3.client("s3")
BUCKET_NAME = os.environ.get("BUCKET_NAME", "health-exposure-data")
BASE_TTL_SECONDS = 3600  # default 1 hour for free tier

def lambda_handler(event, context):
    params = event.get("queryStringParameters") or {}
    path_params = event.get("pathParameters") or {}
    headers = event.get("headers") or {}

    # --- Simulated auth/user context ---
    user_tier = headers.get("x-user-tier", "free").lower()
    user_id = headers.get("x-user-id", "guest")

    if "lat" in params and "lon" in params:
        lat = float(params["lat"])
        lon = float(params["lon"])
        h3_cell = h3.latlng_to_cell(lat, lon, 6)
    elif "h3_id" in path_params:
        h3_cell = path_params["h3_id"]
        if not h3.is_valid_cell(h3_cell):
            return error_response(400, "Invalid H3 index")
        lat, lon = h3.cell_to_latlng(h3_cell)
    else:
        return error_response(400, "Missing lat/lon or h3_id")

    TTL_SECONDS = 300 if user_tier == "premium" else BASE_TTL_SECONDS
    key = f"cells/{h3_cell}.json"

    try:
        response = s3.get_object(Bucket=BUCKET_NAME, Key=key)
        body = json.loads(response["Body"].read().decode("utf-8"))
        if body.get("last_updated") and not is_stale(body["last_updated"], TTL_SECONDS):
            return success_response(body)
    except s3.exceptions.NoSuchKey:
        pass
    except Exception as e:
        print(f"Error reading from S3: {e}")

    try:
        request_context = {
            "lat": lat,
            "lon": lon,
            "h3_cell": h3_cell,
            "user_tier": user_tier,
            "user_id": user_id
        }

        location = reverse_geocode(lat, lon)
        air_quality = get_air_quality(request_context)
        tap_water = is_tap_water_safe(request_context)
        uv = get_uv_index(request_context)
        humidity = get_humidity(request_context)
        pollen = get_pollen(request_context)
        
        enriched = {
            "h3_cell": h3_cell,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "last_updated": int(time.time()),
            "location": location,
            "data": {
                "air_quality": air_quality,
                "tap_water": tap_water,
                "uv": uv,
                "humidity": humidity,
                "pollen": pollen
            }
        }

        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=key,
            Body=json.dumps(enriched),
            ContentType="application/json",
            Metadata={"last_updated": str(enriched["last_updated"])},
            CacheControl=f"max-age={TTL_SECONDS}"
        )

        return success_response(enriched)
    except Exception as e:
        print(f"Error generating or saving data: {e}")
        return error_response(500, "Internal server error")

def is_stale(last_updated_unix, ttl_seconds):
    try:
        return (int(time.time()) - int(last_updated_unix)) > ttl_seconds
    except Exception:
        return True

def success_response(body):
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }

def error_response(code, message):
    return {
        "statusCode": code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"error": message})
    }
