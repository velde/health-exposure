import json
import boto3
import os
import time
from datetime import datetime, timezone
import h3
from adapters.newsdata import fetch_local_health_news
from adapters.opencage import reverse_geocode

s3 = boto3.client("s3")
BUCKET_NAME = os.environ.get("BUCKET_NAME", "health-exposure-data")
NEWS_TTL_SECONDS = 21600  # 6 hours for news
BATCH_SIZE = 10  # Number of cells to process in one run
CHECK_INTERVAL = 900  # 15 minutes in seconds

def lambda_handler(event, context):
    try:
        # List all objects in the cells/ prefix
        paginator = s3.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=BUCKET_NAME, Prefix='cells/')
        
        cells_to_update = []
        current_time = time.time()
        
        # Find cells that need updating
        for page in pages:
            if 'Contents' not in page:
                continue
                
            for obj in page['Contents']:
                key = obj['Key']
                if not key.endswith('.json'):
                    continue
                    
                try:
                    response = s3.get_object(Bucket=BUCKET_NAME, Key=key)
                    body = json.loads(response["Body"].read().decode("utf-8"))
                    
                    # Check if news needs updating
                    news = body.get('news', {})
                    fetched_at = news.get('fetched_at')
                    
                    if fetched_at:
                        try:
                            dt = datetime.fromisoformat(fetched_at)
                            news_age = current_time - dt.timestamp()
                            
                            # Only update if news is older than 6 hours
                            if news_age > NEWS_TTL_SECONDS:
                                # Add a small random delay to stagger updates
                                cells_to_update.append((key, news_age))
                        except Exception:
                            cells_to_update.append((key, float('inf')))
                    else:
                        cells_to_update.append((key, float('inf')))
                        
                except Exception as e:
                    print(f"Error processing {key}: {e}")
                    continue
        
        # Sort cells by news age (oldest first) and take only the batch size
        cells_to_update.sort(key=lambda x: x[1], reverse=True)
        cells_to_update = [key for key, _ in cells_to_update[:BATCH_SIZE]]
        
        if cells_to_update:
            process_batch(cells_to_update)
            print(f"Found {len(cells_to_update)} cells with news older than {NEWS_TTL_SECONDS/3600} hours")
        else:
            print("No cells need updating at this time")
            
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Processed {len(cells_to_update)} cells',
                'cells_updated': cells_to_update
            })
        }
        
    except Exception as e:
        print(f"Error in scheduler: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }

def process_batch(cell_keys):
    for key in cell_keys:
        try:
            # Get cell data
            response = s3.get_object(Bucket=BUCKET_NAME, Key=key)
            body = json.loads(response["Body"].read().decode("utf-8"))
            
            # Extract H3 cell and get lat/lon
            h3_cell = body.get('h3_cell')
            if not h3_cell:
                continue
                
            lat, lon = h3.cell_to_latlng(h3_cell)
            location = body.get('location') or reverse_geocode(lat, lon)
            
            # Fetch new news
            news = fetch_local_health_news(lat, lon, location)
            
            # Update the body with new news
            body['news'] = news
            body['last_updated'] = int(time.time())
            
            # Save back to S3
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=key,
                Body=json.dumps(body),
                ContentType="application/json",
                Metadata={"last_updated": str(body["last_updated"])}
            )
            
            print(f"Successfully updated news for cell {h3_cell}")
            
        except Exception as e:
            print(f"Error updating cell {key}: {e}")
            continue 