import os
from datetime import datetime
from .openai_service import OpenAIService

API_KEY = os.getenv("OPENAI_API_KEY")

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
        
        Format the response as a JSON array of news items.
        Only include news from the past month.
        Focus on local health risks, environmental issues, and public health concerns.
        If there are no recent relevant news items, return an empty array."""

        # Get structured response from OpenAI
        system_message = """You are a helpful assistant that provides current news about health and environmental risks. 
        Format your response as a JSON object with an 'articles' array containing news items.
        Each news item should have: title, description, source, link, and pub_date fields."""
        
        response = openai_service.get_structured_completion(prompt, system_message)
        
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

        return {
            "source": "openai",
            "fetched_at": datetime.utcnow().isoformat(),
            "articles": [
                {
                    "title": article.get("title", "No title"),
                    "description": article.get("description", "No description"),
                    "source": article.get("source", "Unknown"),
                    "link": article.get("link", ""),
                    "pub_date": article.get("pub_date", "")
                }
                for article in articles
            ]
        }

    except Exception as e:
        print(f"[ERROR] OpenAI news fetch failed for {location}: {e}")
        return {
            "source": "openai",
            "error": str(e),
            "articles": []
        }