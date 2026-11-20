from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any


RESPONSES_URL = "https://api.openai.com/v1/responses"


class OpenAIResponseError(RuntimeError):
    pass


def extract_output_text(response: dict[str, Any]) -> str:
    for output in response.get("output", []):
        if output.get("type") != "message":
            continue
        for content in output.get("content", []):
            if content.get("type") == "output_text" and isinstance(content.get("text"), str):
                return content["text"]
    raise OpenAIResponseError("The Responses API returned no output_text item")


def create_structured_response(
    *,
    model: str,
    input_items: list[dict[str, Any]],
    schema_name: str,
    schema: dict[str, Any],
    max_output_tokens: int = 16_000,
) -> tuple[dict[str, Any], dict[str, Any]]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise OpenAIResponseError(
            "OPENAI_API_KEY is not set. The local database can still run, but new-book visual analysis and authoring require an API key."
        )

    body = {
        "model": model,
        "store": False,
        "input": input_items,
        "max_output_tokens": max_output_tokens,
        "text": {
            "format": {
                "type": "json_schema",
                "name": schema_name,
                "strict": True,
                "schema": schema,
            }
        },
    }
    request = urllib.request.Request(
        RESPONSES_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=600) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise OpenAIResponseError(f"OpenAI API returned HTTP {error.code}: {detail}") from error
    except urllib.error.URLError as error:
        raise OpenAIResponseError(f"Could not reach the OpenAI API: {error.reason}") from error

    if raw.get("status") == "incomplete":
        raise OpenAIResponseError(f"OpenAI response was incomplete: {raw.get('incomplete_details')}")
    text = extract_output_text(raw)
    try:
        return json.loads(text), raw
    except json.JSONDecodeError as error:
        raise OpenAIResponseError("Structured response contained invalid JSON") from error
