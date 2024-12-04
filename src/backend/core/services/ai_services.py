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
        "Preserve the language."
    ),
    "correct": (
        "Correct grammar and spelling of the markdown text, "
        "preserving language and markdown formatting. "
        'Return JSON: {"answer": "your corrected markdown text"}. '
        "Do not provide any other information."
        "Preserve the language."
    ),
    "rephrase": (
        "Rephrase the given markdown text, "
        "preserving language and markdown formatting. "
        'Return JSON: {"answer": "your rephrased markdown text"}. '
        "Do not provide any other information."
        "Preserve the language."
    ),
    "summarize": (
        "Summarize the markdown text, preserving language and markdown formatting. "
        'Return JSON: {"answer": "your markdown summary"}. '
        "Do not provide any other information."
        "Preserve the language."
    ),
}

AI_TRANSLATE = (
    "Translate to {language:s} for every value of the json provided."
    "Keep the same json but with the value updated, keep the keys accordingly."
    "Do not provide any other information."
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
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": json.dumps({"answer": text})},
            ],
        )

        content = response.choices[0].message.content
        sanitized_content = re.sub(r"(?<!\\)\n", "\\\\n", content)
        sanitized_content = re.sub(r"(?<!\\)\t", "\\\\t", sanitized_content)

        json_response = json.loads(sanitized_content)

        if "answer" not in json_response:
            raise RuntimeError("AI response does not contain an answer")

        return json_response

    def transform(self, text, action):
        """Transform text based on specified action."""
        system_content = AI_ACTIONS[action]
        return self.call_ai_api(system_content, text)

    def translate(self, text, language):
        """Translate text to a specified language."""
        language_display = enums.ALL_LANGUAGES.get(language, language)
        system_content = AI_TRANSLATE.format(language=language_display)
        return self.call_ai_api(system_content, text)
