"""Test converter services."""

from unittest.mock import MagicMock, patch

import pytest
import requests

from core.services.converter_services import (
    InvalidResponseError,
    MissingContentError,
    ServiceUnavailableError,
    ValidationError,
    YdocConverter,
)


def test_auth_header(settings):
    """Test authentication header generation."""
    settings.CONVERSION_API_KEY = "test-key"
    converter = YdocConverter()
    assert converter.auth_header == "Bearer test-key"


def test_convert_markdown_empty_text():
    """Should raise ValidationError when text is empty."""
    converter = YdocConverter()
    with pytest.raises(ValidationError, match="Input text cannot be empty"):
        converter.convert_markdown("")


@patch("requests.post")
def test_convert_markdown_service_unavailable(mock_post):
    """Should raise ServiceUnavailableError when service is unavailable."""
    converter = YdocConverter()

    mock_post.side_effect = requests.RequestException("Connection error")

    with pytest.raises(
        ServiceUnavailableError,
        match="Failed to connect to conversion service",
    ):
        converter.convert_markdown("test text")


@patch("requests.post")
def test_convert_markdown_http_error(mock_post):
    """Should raise ServiceUnavailableError when HTTP error occurs."""
    converter = YdocConverter()

    mock_response = MagicMock()
    mock_response.raise_for_status.side_effect = requests.HTTPError("HTTP Error")
    mock_post.return_value = mock_response

    with pytest.raises(
        ServiceUnavailableError,
        match="Failed to connect to conversion service",
    ):
        converter.convert_markdown("test text")


@patch("requests.post")
def test_convert_markdown_invalid_json_response(mock_post):
    """Should raise InvalidResponseError when response is not valid JSON."""
    converter = YdocConverter()

    mock_response = MagicMock()
    mock_response.json.side_effect = ValueError("Invalid JSON")
    mock_post.return_value = mock_response

    with pytest.raises(
        InvalidResponseError,
        match="Could not parse conversion service response",
    ):
        converter.convert_markdown("test text")


@patch("requests.post")
def test_convert_markdown_missing_content_field(mock_post, settings):
    """Should raise MissingContentError when response is missing required field."""

    settings.CONVERSION_API_CONTENT_FIELD = "expected_field"

    converter = YdocConverter()

    mock_response = MagicMock()
    mock_response.json.return_value = {"wrong_field": "content"}
    mock_post.return_value = mock_response

    with pytest.raises(
        MissingContentError,
        match="Response missing required field: expected_field",
    ):
        converter.convert_markdown("test text")


@patch("requests.post")
def test_convert_markdown_full_integration(mock_post, settings):
    """Test full integration with all settings."""

    settings.CONVERSION_API_URL = "http://test.com"
    settings.CONVERSION_API_KEY = "test-key"
    settings.CONVERSION_API_TIMEOUT = 5
    settings.CONVERSION_API_CONTENT_FIELD = "content"

    converter = YdocConverter()

    expected_content = {"converted": "content"}
    mock_response = MagicMock()
    mock_response.json.return_value = {"content": expected_content}
    mock_post.return_value = mock_response

    result = converter.convert_markdown("test markdown")

    assert result == expected_content
    mock_post.assert_called_once_with(
        "http://test.com",
        json={"content": "test markdown"},
        headers={
            "Authorization": "Bearer test-key",
            "Content-Type": "application/json",
        },
        timeout=5,
    )


@patch("requests.post")
def test_convert_markdown_timeout(mock_post):
    """Should raise ServiceUnavailableError when request times out."""
    converter = YdocConverter()

    mock_post.side_effect = requests.Timeout("Request timed out")

    with pytest.raises(
        ServiceUnavailableError,
        match="Failed to connect to conversion service",
    ):
        converter.convert_markdown("test text")


def test_convert_markdown_none_input():
    """Should raise ValidationError when input is None."""
    converter = YdocConverter()

    with pytest.raises(ValidationError, match="Input text cannot be empty"):
        converter.convert_markdown(None)
