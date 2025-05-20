import os
from dotenv import load_dotenv
import openai

# Load environment variables from .env file
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("Missing OPENAI_API_KEY in .env file")

client = openai.OpenAI(api_key=api_key)

prompt = """Find the 3 most recent and relevant news items related to health and environmental risks in Helsinki, Finland.
For each news item, provide:
- A clear title
- A brief description
- The source (if known)
- The date (if known)

Format the response as a JSON object with an 'articles' array containing news items.
Only include news from the past month.
Focus on local health risks, environmental issues, and public health concerns.
If there are no recent relevant news items, return an empty array."""

system_message = """You are a helpful assistant that provides current news about health and environmental risks. 
Format your response as a JSON object with an 'articles' array containing news items.
Each news item should have: title, description, source, link, and pub_date fields."""

response = client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=[
        {"role": "system", "content": system_message},
        {"role": "user", "content": prompt}
    ],
    response_format={"type": "json_object"}
)

print(response.choices[0].message.content)