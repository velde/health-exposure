import os
from datetime import datetime, timedelta
from adapters.openai_service import OpenAIService

API_KEY = os.getenv("OPENAI_API_KEY")

def is_recent_news(pub_date_str):
    """Check if the news article is from the past year."""
    if not pub_date_str:
        return False
        
    try:
        # Try different date formats
        for fmt in [
            "%Y-%m-%d",  # 2024-05-20
            "%Y-%m-%dT%H:%M:%S",  # 2024-05-20T13:00:00
            "%Y-%m-%dT%H:%M:%S.%f",  # 2024-05-20T13:00:00.000000
            "%Y-%m-%dT%H:%M:%S%z",  # 2024-05-20T13:00:00+00:00
            "%B %d, %Y",  # May 20, 2024
            "%d %B %Y",  # 20 May 2024
            "%Y-%m-%d %H:%M:%S"  # 2024-05-20 13:00:00
        ]:
            try:
                pub_date = datetime.strptime(pub_date_str, fmt)
                # Check if the date is within the last year
                one_year_ago = datetime.now() - timedelta(days=365)
                return pub_date >= one_year_ago
            except ValueError:
                continue
        return False
    except Exception:
        return False

def fetch_local_health_news(lat, lon, location_name=None, language="en"):
    if not API_KEY:
        raise RuntimeError("Missing OPENAI_API_KEY")

    try:
        # Use location name or coordinates in the query
        location = location_name or f"{lat},{lon}"

        # Initialize OpenAI service
        openai_service = OpenAIService()
        
        # Create a prompt that asks for current health and environmental news
        prompt = f"""Find the 3 most recent and relevant news items related to health and environmental risks in {location}.
For each news item, provide:
- A clear title
- A brief description
- The source (if known)
- The date (if known)

Format the response as a JSON object with an 'articles' array containing news items.
Only include news from the past year.
Focus on local health risks, environmental issues, and public health concerns.
If there are no recent relevant news items, return an empty array."""

        # Get structured response from OpenAI
        system_message = """You are a helpful assistant that provides current news about health and environmental risks. 
Format your response as a JSON object with an 'articles' array containing news items.
Each news item should have: title, description, source, link, and pub_date fields.
The pub_date should be in ISO format (YYYY-MM-DD) or a clear date format."""
        
        response = openai_service.get_structured_completion(prompt, system_message)
        print(f"[DEBUG] Raw OpenAI response: {response}")
        
        # Ensure we have a valid response structure
        if not isinstance(response, dict):
            print(f"[ERROR] Invalid response format from OpenAI: {response}")
            return {
                "source": "openai",
                "error": "Invalid response format",
                "articles": []
            }
            
        articles = response.get('articles', [])
        if not isinstance(articles, list):
            print(f"[ERROR] Invalid articles format: {articles}")
            return {
                "source": "openai",
                "error": "Invalid articles format",
                "articles": []
            }

        # Filter out old news
        recent_articles = [
            {
                "title": article.get("title", "No title"),
                "description": article.get("description", "No description"),
                "source": article.get("source", "Unknown"),
                "link": article.get("link", ""),
                "pub_date": article.get("pub_date", "")
            }
            for article in articles
            if is_recent_news(article.get("pub_date"))
        ]

        return {
            "source": "openai",
            "fetched_at": datetime.utcnow().isoformat(),
            "articles": recent_articles
        }

    except Exception as e:
        print(f"[ERROR] OpenAI news fetch failed for {location}: {e}")
        return {
            "source": "openai",
            "error": str(e),
            "articles": []
        }