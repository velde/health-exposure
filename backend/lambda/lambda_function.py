import json
import boto3
import os
import time
import asyncio
import concurrent.futures
from datetime import datetime, timezone
from adapters.openweather import get_air_quality
from adapters.tapwater import is_tap_water_safe
from adapters.uv import get_uv_index
from adapters.humidity import get_humidity
from adapters.pollen import get_pollen
from adapters.opencage import reverse_geocode
from adapters.newsdata import fetch_local_health_news
from validators import validate_coordinates, validate_h3_cell, validate_user_tier, validate_headers
from rate_limiter import check_rate_limit
import h3

s3 = boto3.client("s3")
BUCKET_NAME = os.environ.get("BUCKET_NAME", "health-exposure-data")
BASE_TTL_SECONDS = 3600  # default 1 hour for free tier
NEWS_TTL_SECONDS = 43200  # 12 hours for news

# CORS configuration
ALLOWED_ORIGINS = [
    "https://health-exposure.app",  # Production frontend
    "exp://localhost:19000",        # Local development
    "exp://192.168.1.*:19000",     # Local network development
    "https://web-iota-one-12.vercel.app"  # Vercel deployment
]

def lambda_handler(event, context):
    # Log the full event for debugging
    print(json.dumps({
        "event": event,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }))

    # Handle CORS preflight requests
    if event.get("httpMethod") == "OPTIONS":
        return handle_cors(event)
        
    # Get request details
    params = event.get("queryStringParameters") or {}
    path_params = event.get("pathParameters") or {}
    headers = event.get("headers") or {}
    
    # Log request details
    print(json.dumps({
        "request_details": {
            "params": params,
            "path_params": path_params,
            "headers": headers,
            "path": event.get("path"),
            "resource": event.get("resource"),
            "httpMethod": event.get("httpMethod")
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }))

    # Validate origin
    origin = headers.get("origin")
    if not is_allowed_origin(origin):
        print(json.dumps({
            "error": "Origin not allowed",
            "origin": origin,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }))
        return error_response(403, "Origin not allowed")
    
    # Validate API key for third-party requests
    api_key = headers.get("x-api-key")
    expected_key = os.environ.get("HEALTH_EXPOSURE_API_KEY")
    if not api_key:
        print(json.dumps({
            "error": "Missing API key",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }))
        return error_response(401, "API key is required")
    if not expected_key:
        print(json.dumps({
            "error": "API key validation not configured",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }))
        return error_response(500, "API key validation not configured")
    if api_key != expected_key:
        print(json.dumps({
            "error": "Invalid API key",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }))
        return error_response(401, "Invalid API key")

    # Validate headers
    is_valid, error = validate_headers(headers)
    if not is_valid:
        return error_response(400, error)

    # --- Simulated auth/user context ---
    user_tier = headers.get("x-user-tier", "free").lower()
    force_refresh = params.get("force_refresh", "false").lower() == "true"

    # Validate user tier
    is_valid, error = validate_user_tier(user_tier)
    if not is_valid:
        return error_response(400, error)

    # Check rate limit
    allowed, remaining, reset_time = check_rate_limit(user_tier)
    if not allowed:
        return {
            "statusCode": 429,
            "headers": {
                "Content-Type": "application/json",
                "X-RateLimit-Limit": str(RATE_LIMITS.get(user_tier, RATE_LIMITS['free'])),
                "X-RateLimit-Remaining": str(remaining),
                "X-RateLimit-Reset": str(reset_time)
            },
            "body": json.dumps({
                "error": "Rate limit exceeded",
                "message": "Too many requests. Please try again later.",
                "reset_time": reset_time
            })
        }

    # Get coordinates or H3 cell
    if "lat" in params and "lon" in params:
        try:
            lat = float(params["lat"])
            lon = float(params["lon"])
            is_valid, error = validate_coordinates(lat, lon)
            if not is_valid:
                return error_response(400, error)
            h3_cell = h3.latlng_to_cell(lat, lon, 6)
        except ValueError:
            return error_response(400, "Invalid latitude or longitude format")
    elif "h3_id" in path_params:
        h3_cell = path_params["h3_id"]
        is_valid, error = validate_h3_cell(h3_cell)
        if not is_valid:
            return error_response(400, error)
        lat, lon = h3.cell_to_latlng(h3_cell)
    else:
        return error_response(400, "Missing lat/lon or h3_id")

    TTL_SECONDS = 300 if user_tier == "premium" else BASE_TTL_SECONDS
    key = f"cells/{h3_cell}.json"

    try:
        response = s3.get_object(Bucket=BUCKET_NAME, Key=key)
        body = json.loads(response["Body"].read().decode("utf-8"))
        
        # Only use cached data if not forcing refresh and data is not stale
        if not force_refresh and body.get("last_updated") and not is_stale(body["last_updated"], TTL_SECONDS):
            # Check if news needs refresh based on its own TTL
            news = body.get('news', {})
            fetched_at = news.get('fetched_at')
            refresh_news = False  # Default to using cached news
            
            if fetched_at:
                try:
                    dt = datetime.fromisoformat(fetched_at)
                    refresh_news = dt.timestamp() < time.time() - NEWS_TTL_SECONDS
                except Exception:
                    pass
            
            if refresh_news:
                location = body.get('location') or 'Unknown'
                try:
                    news = fetch_local_health_news(lat, lon, location)
                    body['news'] = news
                    s3.put_object(
                        Bucket=BUCKET_NAME,
                        Key=key,
                        Body=json.dumps(body),
                        ContentType="application/json"
                    )
                except Exception as e:
                    print(f"[ERROR] News fetch failed: {e}")
                    news = {"source": "openai", "error": str(e), "articles": []}
                    body['news'] = news
            
            # Add rate limit info to response
            body['rate_limit'] = {
                'remaining': remaining,
                'reset_time': reset_time
            }
            return success_response(body, origin)
    except s3.exceptions.NoSuchKey:
        pass
    except Exception as e:
        print(f"Error reading from S3: {e}")

    # If we get here, either there was no cached data, it was stale, or force_refresh was true
    try:
        request_context = {
            "lat": lat,
            "lon": lon,
            "h3_cell": h3_cell,
            "user_tier": user_tier
        }

        print(f"[INFO] Fetching data for coordinates: {lat}, {lon}")
        
        # Get location first (needed for news)
        try:
            location = reverse_geocode(lat, lon)
            print(f"[INFO] Location: {location}")
        except Exception as e:
            print(f"[ERROR] Reverse geocoding failed: {e}")
            location = "Unknown"

        # Fetch all data in parallel with timeout
        def fetch_with_timeout(func, context, timeout=8):
            """Fetch data with timeout"""
            try:
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(func, context)
                    return future.result(timeout=timeout)
            except concurrent.futures.TimeoutError:
                print(f"[WARNING] {func.__name__} timed out after {timeout}s")
                return {"error": "Request timed out"}
            except Exception as e:
                print(f"[ERROR] {func.__name__} failed: {e}")
                return {"error": str(e)}

        # Fetch all environmental data in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
            # Submit all tasks
            air_quality_future = executor.submit(fetch_with_timeout, get_air_quality, request_context)
            tap_water_future = executor.submit(fetch_with_timeout, is_tap_water_safe, request_context)
            uv_future = executor.submit(fetch_with_timeout, get_uv_index, request_context)
            humidity_future = executor.submit(fetch_with_timeout, get_humidity, request_context)
            pollen_future = executor.submit(fetch_with_timeout, get_pollen, request_context)
            news_future = executor.submit(fetch_with_timeout, fetch_local_health_news, lat, lon, location)

            # Wait for all results with timeout
            try:
                air_quality = air_quality_future.result(timeout=10)
                tap_water = tap_water_future.result(timeout=10)
                uv = uv_future.result(timeout=10)
                humidity = humidity_future.result(timeout=10)
                pollen = pollen_future.result(timeout=10)
                news = news_future.result(timeout=10)
                
                print(f"[INFO] All data fetched successfully")
            except concurrent.futures.TimeoutError:
                print(f"[ERROR] Some API calls timed out")
                # Return partial data
                air_quality = air_quality_future.result(timeout=1) if not air_quality_future.done() else {"error": "Timeout"}
                tap_water = tap_water_future.result(timeout=1) if not tap_water_future.done() else {"error": "Timeout"}
                uv = uv_future.result(timeout=1) if not uv_future.done() else {"error": "Timeout"}
                humidity = humidity_future.result(timeout=1) if not humidity_future.done() else {"error": "Timeout"}
                pollen = pollen_future.result(timeout=1) if not pollen_future.done() else {"error": "Timeout"}
                news = news_future.result(timeout=1) if not news_future.done() else {"error": "Timeout", "articles": []}

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
            },
            "news": news,
            "rate_limit": {
                'remaining': remaining,
                'reset_time': reset_time
            }
        }

        try:
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=key,
                Body=json.dumps(enriched),
                ContentType="application/json",
                Metadata={"last_updated": str(enriched["last_updated"])},
                CacheControl=f"max-age={TTL_SECONDS}"
            )
            print(f"[INFO] Successfully saved data to S3")
        except Exception as e:
            print(f"[ERROR] Failed to save to S3: {e}")
            return error_response(500, f"Failed to save data: {str(e)}", origin)

        return success_response(enriched, origin)
    except Exception as e:
        print(f"[ERROR] Unexpected error in data generation: {e}")
        return error_response(500, f"Internal server error: {str(e)}", origin)

def is_stale(last_updated_unix, ttl_seconds):
    try:
        return (int(time.time()) - int(last_updated_unix)) > ttl_seconds
    except Exception:
        return True

def handle_cors(event):
    """Handle CORS preflight requests"""
    headers = event.get("headers", {})
    origin = headers.get("origin")
    
    if not is_allowed_origin(origin):
        return error_response(403, "Origin not allowed")
        
    return {
        "statusCode": 204,
        "headers": {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,x-user-tier,x-api-key",
            "Access-Control-Max-Age": "86400"  # 24 hours
        }
    }

def is_allowed_origin(origin):
    """Check if the origin is allowed"""
    if not origin:
        return False
    return any(origin.startswith(allowed) for allowed in ALLOWED_ORIGINS)

def is_valid_api_key(api_key):
    """Validate API key"""
    if not api_key:
        return False
    # TODO: Implement proper API key validation
    # For now, we'll accept any non-empty key
    return True

def success_response(body, origin=None):
    """Return success response with CORS headers"""
    headers = {"Content-Type": "application/json"}
    if origin and is_allowed_origin(origin):
        headers["Access-Control-Allow-Origin"] = origin
    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps(body)
    }

def error_response(code, message, origin=None):
    """Return error response with CORS headers"""
    headers = {"Content-Type": "application/json"}
    if origin and is_allowed_origin(origin):
        headers["Access-Control-Allow-Origin"] = origin
    return {
        "statusCode": code,
        "headers": headers,
        "body": json.dumps({"error": message})
    }
