import os
import requests
from datetime import datetime

API_KEY = os.getenv("NEWSDATA_API_KEY")

def fetch_local_health_news(lat, lon, location_name=None, language="en"):
    if not API_KEY:
        raise RuntimeError("Missing NEWSDATA_API_KEY")

    try:
        # Use location name or coordinates in the query
        query = location_name or f"{lat},{lon}"

        params = {
            "apikey": API_KEY,
            "q": query,
            "language": language,
            "category": "health,environment",  # Include both health and environment categories
            "page": 1,
            "page_size": 5
        }

        response = requests.get("https://newsdata.io/api/1/news", params=params)
        response.raise_for_status()
        articles = response.json().get("results", [])

        return {
            "source": "newsdata.io",
            "fetched_at": datetime.utcnow().isoformat(),
            "articles": [
                {
                    "title": article.get("title"),
                    "description": article.get("description"),
                    "source": article.get("source_id"),
                    "link": article.get("link"),
                    "pub_date": article.get("pubDate")
                }
                for article in articles
            ]
        }

    except Exception as e:
        print(f"[ERROR] NewsData API failed for {query}: {e}")
        return {
            "source": "newsdata.io",
            "error": str(e),
            "articles": []
        }