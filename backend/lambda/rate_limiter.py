import boto3
import json
import time
import os
from datetime import datetime, timedelta

s3 = boto3.client("s3")
BUCKET_NAME = os.environ.get("BUCKET_NAME", "health-exposure-data")

# Rate limits per hour
RATE_LIMITS = {
    'free': 100,
    'premium': 1000
}

# Rate limit data expires after 2 hours (to be safe)
RATE_LIMIT_TTL = 7200  # 2 hours in seconds

def check_rate_limit(user_tier):
    """
    Check if the current request has exceeded the rate limit.
    Returns (allowed: bool, remaining: int, reset_time: int)
    """
    try:
        # Get current hour timestamp
        current_hour = int(time.time() / 3600) * 3600
        key = f"rate-limits/{current_hour}.json"
        
        try:
            # Try to get existing record
            response = s3.get_object(Bucket=BUCKET_NAME, Key=key)
            data = json.loads(response["Body"].read().decode("utf-8"))
            
            # Check if data is expired
            if data.get("expires_at", 0) < time.time():
                count = 0
            else:
                count = data.get("count", 0)
            
            # Validate count is a reasonable number
            if not isinstance(count, int) or count < 0 or count > 1000000:
                print(f"Invalid count value: {count}")
                count = 0
                
        except s3.exceptions.NoSuchKey:
            count = 0
            
        # Check against rate limit
        limit = RATE_LIMITS.get(user_tier, RATE_LIMITS['free'])
        remaining = max(0, limit - count)
        allowed = count < limit
        
        # Update count if allowed
        if allowed:
            expires_at = int(time.time() + RATE_LIMIT_TTL)
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=key,
                Body=json.dumps({
                    "count": count + 1,
                    "hour": current_hour,
                    "updated_at": int(time.time()),
                    "expires_at": expires_at
                }),
                ContentType="application/json"
            )
            
        # Calculate reset time (next hour)
        reset_time = current_hour + 3600
        
        return allowed, remaining, reset_time
        
    except Exception as e:
        print(f"Rate limit error: {e}")
        # Fail open in case of S3 issues
        return True, RATE_LIMITS.get(user_tier, RATE_LIMITS['free']), int(time.time()) + 3600 