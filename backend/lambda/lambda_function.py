import json
import boto3
import os
import time
from datetime import datetime, timezone
from adapters.openweather import get_air_quality
import h3

s3 = boto3.client("s3")
BUCKET_NAME = os.environ.get("BUCKET_NAME", "health-exposure-data")
TTL_SECONDS = 3600  # 1 hour

def lambda_handler(event, context):
    # Support 2 modes: /?lat=...&lon=... and /cells/fallback/{h3_id}
    params = event.get("queryStringParameters") or {}
    path_params = event.get("pathParameters") or {}

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

    key = f"cells/{h3_cell}.json"

    try:
        response = s3.get_object(Bucket=BUCKET_NAME, Key=key)
        body = json.loads(response["Body"].read().decode("utf-8"))
        if body.get("last_updated") and not is_stale(body["last_updated"]):
            return success_response(body)
    except s3.exceptions.NoSuchKey:
        pass
    except Exception as e:
        print(f"Error reading from S3: {e}")

    # Regenerate if missing or stale
    try:
        data = get_air_quality(lat, lon)
        enriched = {
            "h3_cell": h3_cell,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "last_updated": int(time.time()),
            "data": data
        }
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=key,
            Body=json.dumps(enriched),
            ContentType="application/json"
        )
        return success_response(enriched)
    except Exception as e:
        print(f"Error generating or saving data: {e}")
        return error_response(500, "Internal server error")

def is_stale(last_updated_unix):
    try:
        return (int(time.time()) - int(last_updated_unix)) > TTL_SECONDS
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
