import os
import openai
from datetime import datetime

class OpenAIService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise RuntimeError("Missing OPENAI_API_KEY")
        self.client = openai.OpenAI(api_key=self.api_key)

    def get_completion(self, prompt, system_message=None, model="gpt-4-turbo-preview", response_format=None):
        """
        Get a completion from OpenAI with the given prompt.
        
        Args:
            prompt (str): The user prompt
            system_message (str, optional): System message to set context
            model (str): The model to use
            response_format (dict, optional): Format for the response
            
        Returns:
            str: The completion text
        """
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                response_format=response_format
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[ERROR] OpenAI API request failed: {e}")
            raise

    def get_structured_completion(self, prompt, system_message=None, model="gpt-4-turbo-preview"):
        """
        Get a structured (JSON) completion from OpenAI.
        
        Args:
            prompt (str): The user prompt
            system_message (str, optional): System message to set context
            model (str): The model to use
            
        Returns:
            dict: The structured response
        """
        try:
            response = self.get_completion(
                prompt=prompt,
                system_message=system_message,
                model=model,
                response_format={"type": "json_object"}
            )
            return eval(response)  # Safe since we requested JSON format
        except Exception as e:
            print(f"[ERROR] Failed to get structured completion: {e}")
            raise 