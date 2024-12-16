"""AI services."""

import json
import re

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from openai import OpenAI

from core import enums

AI_ACTIONS = {
    "prompt": (
        "Answer the prompt in markdown format. Return JSON: "
        '{"answer": "Your markdown answer"}. '
        "Do not provide any other information."
    ),
    "correct": (
        "Correct grammar and spelling of the markdown text, "
        "preserving language and markdown formatting. "
        'Return JSON: {"answer": "your corrected markdown text"}. '
        "Do not provide any other information."
    ),
    "rephrase": (
        "Rephrase the given markdown text, "
        "preserving language and markdown formatting. "
        'Return JSON: {"answer": "your rephrased markdown text"}. '
        "Do not provide any other information."
    ),
    "summarize": (
        "Summarize the markdown text, preserving language and markdown formatting. "
        'Return JSON: {"answer": "your markdown summary"}. '
        "Do not provide any other information."
    ),
}


AI_TRANSLATE = (
    """  
    You are a professional translator for `{language:s}`.  

    ### Guidelines:  
    1. **Preserve exactly as-is:**  
       - All formatting, markdown, symbols, tags  
       - Names, numbers, URLs, citations  
       - Code blocks and technical terms  
    
    2. **Translation Rules:**  
       - Use natural expressions in the target language  
       - Match the tone of the source text (default: professional)  
       - Maintain original meaning precisely  
       - Adapt idioms to suit the target culture  
       - Ensure grammatical correctness stylistic coherence
    
    3. **Do Not:**  
       - Add, remove, or explain any content  
    
    Output only the translated text, keeping all original formatting intact.
    """
)


class AIService:
    """Service class for AI-related operations."""

    def __init__(self):
        """Ensure that the AI configuration is set properly."""
        if (
            settings.AI_BASE_URL is None
            or settings.AI_API_KEY is None
            or settings.AI_MODEL is None
        ):
            raise ImproperlyConfigured("AI configuration not set")
        self.client = OpenAI(base_url=settings.AI_BASE_URL, api_key=settings.AI_API_KEY)

    def call_ai_api(self, system_content, text):
        """Helper method to call the OpenAI API and process the response."""
        response = self.client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": text},
            ],
        )

        content = response.choices[0].message.content
        return {"answer": content}

    def transform(self, text, action):
        """Transform text based on specified action."""
        system_content = AI_ACTIONS[action]
        return self.call_ai_api(system_content, text)

    def translate(self, text, language):
        """Translate text to a specified language."""
        language_display = enums.ALL_LANGUAGES.get(language, language)
        system_content = AI_TRANSLATE.format(language=language_display)
        return self.call_ai_api(system_content, text)
