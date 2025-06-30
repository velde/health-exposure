import requests
from datetime import datetime, timezone

CURRENTUV_URL = "https://currentuvindex.com/api/v1/uvi"
REQUEST_TIMEOUT = 5  # 5 seconds timeout

def get_uv_index(ctx):
    lat, lon = ctx["lat"], ctx["lon"]

    try:
        response = requests.get(CURRENTUV_URL, params={"latitude": lat, "longitude": lon}, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        data = response.json()

        # Current UV data
        now_data = data.get("now", {})
        uv = now_data.get("uvi")
        timestamp = now_data.get("time")
        
        # Calculate max UV for today's daylight hours
        max_uv = None
        max_uv_time = None
        
        # Get today's date in UTC
        today = datetime.now(timezone.utc).date()
        print(f"[DEBUG] Today's date (UTC): {today}")
        print(f"[DEBUG] Current UV: {uv}")
        
        # Combine history and forecast data for today, sorted by time
        today_uv_data = []
        
        # Process history data (past 24 hours)
        history_data = data.get("history", [])
        print(f"[DEBUG] Processing {len(history_data)} history entries")
        for entry in history_data:
            try:
                entry_time = datetime.fromisoformat(entry["time"].replace("Z", "+00:00"))
                print(f"[DEBUG] History entry: {entry['time']} -> {entry_time.date()}, UV: {entry['uvi']}")
                if entry_time.date() == today:
                    today_uv_data.append((entry["uvi"], entry["time"], entry_time))
            except (ValueError, KeyError) as e:
                print(f"[DEBUG] Error parsing history entry: {e}")
                continue
        
        # Process forecast data
        forecast_data = data.get("forecast", [])
        print(f"[DEBUG] Processing {len(forecast_data)} forecast entries")
        for entry in forecast_data:
            try:
                entry_time = datetime.fromisoformat(entry["time"].replace("Z", "+00:00"))
                print(f"[DEBUG] Forecast entry: {entry['time']} -> {entry_time.date()}, UV: {entry['uvi']}")
                if entry_time.date() == today:
                    today_uv_data.append((entry["uvi"], entry["time"], entry_time))
            except (ValueError, KeyError) as e:
                print(f"[DEBUG] Error parsing forecast entry: {e}")
                continue
        
        # Sort by time to get chronological order
        today_uv_data.sort(key=lambda x: x[2])
        print(f"[DEBUG] Today's UV data sorted by time: {[(uv, time, dt.strftime('%H:%M')) for uv, time, dt in today_uv_data]}")
        
        if today_uv_data:
            # Find the first non-zero UV reading (sunrise)
            sunrise_data = None
            for uv_val, time_str, dt in today_uv_data:
                if uv_val > 0:
                    sunrise_data = (uv_val, time_str, dt)
                    print(f"[DEBUG] Found sunrise (first non-zero UV): {uv_val} at {time_str}")
                    break
            
            if sunrise_data:
                sunrise_time = sunrise_data[2]
                
                # Find the maximum UV from sunrise until it goes back to zero (sunset)
                daylight_uv_data = []
                for uv_val, time_str, dt in today_uv_data:
                    if dt >= sunrise_time:
                        daylight_uv_data.append((uv_val, time_str, dt))
                        # Stop when we hit zero again (sunset)
                        if uv_val == 0 and len(daylight_uv_data) > 1:
                            break
                
                print(f"[DEBUG] Daylight UV data (from sunrise to sunset): {[(uv, time, dt.strftime('%H:%M')) for uv, time, dt in daylight_uv_data]}")
                
                if daylight_uv_data:
                    # Find the maximum UV during daylight hours
                    max_entry = max(daylight_uv_data, key=lambda x: x[0])
                    max_uv = max_entry[0]
                    max_uv_time = max_entry[1]
                    print(f"[DEBUG] Today's daylight max UV found: {max_uv} at {max_uv_time}")
                    
                    # Compare with current UV and use the higher value
                    if uv is not None and uv > max_uv:
                        max_uv = uv
                        max_uv_time = timestamp
                        print(f"[DEBUG] Using current UV as max: {max_uv} (higher than daylight max: {max_entry[0]})")
                    else:
                        print(f"[DEBUG] Using daylight max UV: {max_uv}")
                else:
                    print(f"[DEBUG] No daylight UV data found")
                    if uv is not None:
                        max_uv = uv
                        max_uv_time = timestamp
                        print(f"[DEBUG] No daylight data, using current UV as max: {max_uv}")
            else:
                print(f"[DEBUG] No sunrise (non-zero UV) found for today")
                if uv is not None:
                    max_uv = uv
                    max_uv_time = timestamp
                    print(f"[DEBUG] No sunrise data, using current UV as max: {max_uv}")
        else:
            print(f"[DEBUG] No UV data found for today")
            # If no data, use current UV as max
            if uv is not None:
                max_uv = uv
                max_uv_time = timestamp
                print(f"[DEBUG] No data for today, using current UV as max: {max_uv}")

        return {
            "source": "currentuvindex.com",
            "uv_index": uv,
            "timestamp": timestamp,
            "max_uv": max_uv,
            "max_uv_time": max_uv_time
        }

    except Exception as e:
        print(f"[ERROR] UV adapter failed for {lat}, {lon}: {e}")
        return None
