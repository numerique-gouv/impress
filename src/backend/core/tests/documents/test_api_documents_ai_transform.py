"""
Test AI transform API endpoint for users in impress's core app.
"""

from unittest.mock import MagicMock, patch

from django.core.cache import cache
from django.test import override_settings

import pytest
from rest_framework.test import APIClient

from core import factories
from core.tests.conftest import TEAM, USER, VIA

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def clear_cache():
    """Fixture to clear the cache before each test."""
    cache.clear()


@pytest.fixture
def ai_settings():
    """Fixture to set AI settings."""
    with override_settings(
        AI_BASE_URL="http://example.com", AI_API_KEY="test-key", AI_MODEL="llama"
    ):
        yield


@pytest.mark.parametrize(
    "reach, role",
    [
        ("restricted", "reader"),
        ("restricted", "editor"),
        ("authenticated", "reader"),
        ("authenticated", "editor"),
        ("public", "reader"),
    ],
)
def test_api_documents_ai_transform_anonymous_forbidden(reach, role):
    """
    Anonymous users should not be able to request AI transform if the link reach
    and role don't allow it.
    """
    document = factories.DocumentFactory(link_reach=reach, link_role=role)

    url = f"/api/v1.0/documents/{document.id!s}/ai-transform/"
    response = APIClient().post(url, {"text": "hello", "action": "prompt"})

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }


@pytest.mark.usefixtures("ai_settings")
@patch("openai.resources.chat.completions.Completions.create")
def test_api_documents_ai_transform_anonymous_success(mock_create):
    """
    Anonymous users should be able to request AI transform to a document
    if the link reach and role permit it.
    """
    document = factories.DocumentFactory(link_reach="public", link_role="editor")

    answer = '{"answer": "Salut"}'
    mock_create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content=answer))]
    )

    url = f"/api/v1.0/documents/{document.id!s}/ai-transform/"
    response = APIClient().post(url, {"text": "Hello", "action": "summarize"})

    assert response.status_code == 200
    assert response.json() == {"answer": "Salut"}
    mock_create.assert_called_once_with(
        model="llama",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "Summarize the markdown text, preserving language and markdown formatting. "
                    'Return JSON: {"answer": "your markdown summary"}. Do not provide any other '
                    "information."
                    "Preserve the language."
                ),
            },
            {"role": "user", "content": '{"answer": "Hello"}'},
        ],
    )


@pytest.mark.parametrize(
    "reach, role",
    [
        ("restricted", "reader"),
        ("restricted", "editor"),
        ("authenticated", "reader"),
        ("public", "reader"),
    ],
)
def test_api_documents_ai_transform_authenticated_forbidden(reach, role):
    """
    Users who are not related to a document can't request AI transform if the
    link reach and role don't allow it.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(link_reach=reach, link_role=role)

    url = f"/api/v1.0/documents/{document.id!s}/ai-transform/"
    response = client.post(url, {"text": "Hello", "action": "prompt"})

    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }


@pytest.mark.parametrize(
    "reach, role",
    [
        ("authenticated", "editor"),
        ("public", "editor"),
    ],
)
@pytest.mark.usefixtures("ai_settings")
@patch("openai.resources.chat.completions.Completions.create")
def test_api_documents_ai_transform_authenticated_success(mock_create, reach, role):
    """
    Autenticated who are not related to a document should be able to request AI transform
    if the link reach and role permit it.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(link_reach=reach, link_role=role)

    answer = '{"answer": "Salut"}'
    mock_create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content=answer))]
    )

    url = f"/api/v1.0/documents/{document.id!s}/ai-transform/"
    response = client.post(url, {"text": "Hello", "action": "prompt"})

    assert response.status_code == 200
    assert response.json() == {"answer": "Salut"}
    mock_create.assert_called_once_with(
        model="llama",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    'Answer the prompt in markdown format. Return JSON: {"answer": '
                    '"Your markdown answer"}. Do not provide any other information.'
                    "Preserve the language."
                ),
            },
            {"role": "user", "content": '{"answer": "Hello"}'},
        ],
    )


@pytest.mark.parametrize("via", VIA)
def test_api_documents_ai_transform_reader(via, mock_user_teams):
    """
    Users who are simple readers on a document should not be allowed to request AI transform.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(link_role="reader")
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role="reader")
    elif via == TEAM:
        mock_user_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role="reader"
        )

    url = f"/api/v1.0/documents/{document.id!s}/ai-transform/"
    response = client.post(url, {"text": "Hello", "action": "prompt"})

    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }


@pytest.mark.parametrize("role", ["editor", "administrator", "owner"])
@pytest.mark.parametrize("via", VIA)
@pytest.mark.usefixtures("ai_settings")
@patch("openai.resources.chat.completions.Completions.create")
def test_api_documents_ai_transform_success(mock_create, via, role, mock_user_teams):
    """
    Editors, administrators and owners of a document should be able to request AI transform.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role=role)
    elif via == TEAM:
        mock_user_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role=role
        )

    answer = '{"answer": "Salut"}'
    mock_create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content=answer))]
    )

    url = f"/api/v1.0/documents/{document.id!s}/ai-transform/"
    response = client.post(url, {"text": "Hello", "action": "prompt"})

    assert response.status_code == 200
    assert response.json() == {"answer": "Salut"}
    mock_create.assert_called_once_with(
        model="llama",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    'Answer the prompt in markdown format. Return JSON: {"answer": '
                    '"Your markdown answer"}. Do not provide any other information.'
                    "Preserve the language."
                ),
            },
            {"role": "user", "content": '{"answer": "Hello"}'},
        ],
    )


def test_api_documents_ai_transform_empty_text():
    """The text should not be empty when requesting AI transform."""
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(link_reach="public", link_role="editor")

    url = f"/api/v1.0/documents/{document.id!s}/ai-transform/"
    response = client.post(url, {"text": " ", "action": "prompt"})

    assert response.status_code == 400
    assert response.json() == {"text": ["This field may not be blank."]}


def test_api_documents_ai_transform_invalid_action():
    """The action should valid when requesting AI transform."""
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(link_reach="public", link_role="editor")

    url = f"/api/v1.0/documents/{document.id!s}/ai-transform/"
    response = client.post(url, {"text": "Hello", "action": "invalid"})

    assert response.status_code == 400
    assert response.json() == {"action": ['"invalid" is not a valid choice.']}


@override_settings(AI_DOCUMENT_RATE_THROTTLE_RATES={"minute": 3, "hour": 6, "day": 10})
@pytest.mark.usefixtures("ai_settings")
@patch("openai.resources.chat.completions.Completions.create")
def test_api_documents_ai_transform_throttling_document(mock_create):
    """
    Throttling per document should be triggered on the AI transform endpoint.
    For full throttle class test see: `test_api_utils_ai_document_rate_throttles`
    """
    client = APIClient()
    document = factories.DocumentFactory(link_reach="public", link_role="editor")

    answer = '{"answer": "Salut"}'
    mock_create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content=answer))]
    )

    url = f"/api/v1.0/documents/{document.id!s}/ai-transform/"
    for _ in range(3):
        user = factories.UserFactory()
        client.force_login(user)
        response = client.post(url, {"text": "Hello", "action": "summarize"})
        assert response.status_code == 200
        assert response.json() == {"answer": "Salut"}

    user = factories.UserFactory()
    client.force_login(user)
    response = client.post(url, {"text": "Hello", "action": "summarize"})

    assert response.status_code == 429
    assert response.json() == {
        "detail": "Request was throttled. Expected available in 60 seconds."
    }


@override_settings(AI_USER_RATE_THROTTLE_RATES={"minute": 3, "hour": 6, "day": 10})
@pytest.mark.usefixtures("ai_settings")
@patch("openai.resources.chat.completions.Completions.create")
def test_api_documents_ai_transform_throttling_user(mock_create):
    """
    Throttling per user should be triggered on the AI transform endpoint.
    For full throttle class test see: `test_api_utils_ai_user_rate_throttles`
    """
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    answer = '{"answer": "Salut"}'
    mock_create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content=answer))]
    )

    for _ in range(3):
        document = factories.DocumentFactory(link_reach="public", link_role="editor")
        url = f"/api/v1.0/documents/{document.id!s}/ai-transform/"
        response = client.post(url, {"text": "Hello", "action": "summarize"})
        assert response.status_code == 200
        assert response.json() == {"answer": "Salut"}

    document = factories.DocumentFactory(link_reach="public", link_role="editor")
    url = f"/api/v1.0/documents/{document.id!s}/ai-transform/"
    response = client.post(url, {"text": "Hello", "action": "summarize"})

    assert response.status_code == 429
    assert response.json() == {
        "detail": "Request was throttled. Expected available in 60 seconds."
    }
