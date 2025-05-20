import os
import time
import sys
from dotenv import load_dotenv

# Load environment variables from .env file in root directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

# Add the adapters directory to Python path
adapters_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'lambda', 'adapters'))
sys.path.insert(0, adapters_dir)

from newsdata import fetch_local_health_news

def test_news_fetch():
    # Helsinki coordinates
    lat = 60.192059
    lon = 24.945831
    
    print("\n=== Testing News Fetch ===")
    print(f"Location: Helsinki ({lat}, {lon})")
    
    # Time the entire operation
    start_time = time.time()
    
    try:
        # Time the API call
        api_start = time.time()
        result = fetch_local_health_news(lat, lon)
        api_time = time.time() - api_start
        
        # Time the response processing
        process_start = time.time()
        articles = result.get('articles', [])
        process_time = time.time() - process_start
        
        total_time = time.time() - start_time
        
        print("\n=== Timing Information ===")
        print(f"API Call Time: {api_time:.2f} seconds")
        print(f"Processing Time: {process_time:.2f} seconds")
        print(f"Total Time: {total_time:.2f} seconds")
        
        print("\n=== Response ===")
        print(f"Source: {result.get('source')}")
        print(f"Fetched at: {result.get('fetched_at')}")
        
        if 'error' in result:
            print(f"\nError: {result['error']}")
        
        print("\n=== Articles ===")
        if articles:
            for i, article in enumerate(articles, 1):
                print(f"\nArticle {i}:")
                print(f"Title: {article.get('title')}")
                print(f"Description: {article.get('description')}")
                print(f"Source: {article.get('source')}")
                print(f"Link: {article.get('link')}")
                print(f"Published: {article.get('pub_date')}")
        else:
            print("No articles found")
            
    except Exception as e:
        print(f"\nError occurred: {e}")
        total_time = time.time() - start_time
        print(f"\nTotal time before error: {total_time:.2f} seconds")

if __name__ == "__main__":
    test_news_fetch() 