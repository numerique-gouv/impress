"""
Tests for Documents API endpoint in impress's core app: create
"""

# pylint: disable=W0621

from unittest.mock import patch

from django.core import mail
from django.test import override_settings

import pytest
from rest_framework.test import APIClient

from core import factories
from core.models import Document, Invitation, User
from core.services.converter_services import ConversionError, YdocConverter

pytestmark = pytest.mark.django_db


@pytest.fixture
def mock_convert_markdown():
    """Mock YdocConverter.convert_markdown to return a converted content."""
    with patch.object(
        YdocConverter,
        "convert_markdown",
        return_value="Converted document content",
    ) as mock:
        yield mock


def test_api_documents_create_for_owner_missing_token():
    """Requests with no token should not be allowed to create documents for owner."""
    data = {
        "title": "My Document",
        "content": "Document content",
        "sub": "123",
        "email": "john.doe@example.com",
    }

    response = APIClient().post(
        "/api/v1.0/documents/create-for-owner/", data, format="json"
    )

    assert response.status_code == 401
    assert not Document.objects.exists()


@override_settings(SERVER_TO_SERVER_API_TOKENS=["DummyToken"])
def test_api_documents_create_for_owner_invalid_token():
    """Requests with an invalid token should not be allowed to create documents for owner."""
    data = {
        "title": "My Document",
        "content": "Document content",
        "sub": "123",
        "email": "john.doe@example.com",
        "language": "fr",
    }

    response = APIClient().post(
        "/api/v1.0/documents/create-for-owner/",
        data,
        format="json",
        HTTP_AUTHORIZATION="Bearer InvalidToken",
    )

    assert response.status_code == 401
    assert not Document.objects.exists()


def test_api_documents_create_for_owner_authenticated_forbidden():
    """
    Authenticated users should not be allowed to call create documents on behalf of other users.
    This API endpoint is reserved for server-to-server calls.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    data = {
        "title": "My Document",
        "content": "Document content",
        "sub": "123",
        "email": "john.doe@example.com",
    }

    response = client.post(
        "/api/v1.0/documents/create-for-owner/",
        data,
        format="json",
    )

    assert response.status_code == 401
    assert not Document.objects.exists()


@override_settings(SERVER_TO_SERVER_API_TOKENS=["DummyToken"])
def test_api_documents_create_for_owner_missing_sub():
    """Requests with no sub should not be allowed to create documents for owner."""
    data = {
        "title": "My Document",
        "content": "Document content",
        "email": "john.doe@example.com",
    }

    response = APIClient().post(
        "/api/v1.0/documents/create-for-owner/",
        data,
        format="json",
        HTTP_AUTHORIZATION="Bearer DummyToken",
    )

    assert response.status_code == 400
    assert not Document.objects.exists()

    assert response.json() == {"sub": ["This field is required."]}


@override_settings(SERVER_TO_SERVER_API_TOKENS=["DummyToken"])
def test_api_documents_create_for_owner_missing_email():
    """Requests with no email should not be allowed to create documents for owner."""
    data = {
        "title": "My Document",
        "content": "Document content",
        "sub": "123",
    }

    response = APIClient().post(
        "/api/v1.0/documents/create-for-owner/",
        data,
        format="json",
        HTTP_AUTHORIZATION="Bearer DummyToken",
    )

    assert response.status_code == 400
    assert not Document.objects.exists()

    assert response.json() == {"email": ["This field is required."]}


@override_settings(SERVER_TO_SERVER_API_TOKENS=["DummyToken"])
def test_api_documents_create_for_owner_invalid_sub():
    """Requests with an invalid sub should not be allowed to create documents for owner."""
    data = {
        "title": "My Document",
        "content": "Document content",
        "sub": "123!!",
        "email": "john.doe@example.com",
    }

    response = APIClient().post(
        "/api/v1.0/documents/create-for-owner/",
        data,
        format="json",
        HTTP_AUTHORIZATION="Bearer DummyToken",
    )

    assert response.status_code == 400
    assert not Document.objects.exists()

    assert response.json() == {
        "sub": [
            "Enter a valid sub. This value may contain only letters, "
            "numbers, and @/./+/-/_/: characters."
        ]
    }


@override_settings(SERVER_TO_SERVER_API_TOKENS=["DummyToken"])
def test_api_documents_create_for_owner_existing(mock_convert_markdown):
    """It should be possible to create a document on behalf of a pre-existing user."""
    user = factories.UserFactory(language="en-us")

    data = {
        "title": "My Document",
        "content": "Document content",
        "sub": str(user.sub),
        "email": "irrelevant@example.com",  # Should be ignored since the user already exists
    }

    response = APIClient().post(
        "/api/v1.0/documents/create-for-owner/",
        data,
        format="json",
        HTTP_AUTHORIZATION="Bearer DummyToken",
    )

    assert response.status_code == 201

    mock_convert_markdown.assert_called_once_with("Document content")

    document = Document.objects.get()
    assert response.json() == {"id": str(document.id)}

    assert document.title == "My Document"
    assert document.content == "Converted document content"
    assert document.creator == user
    assert document.accesses.filter(user=user, role="owner").exists()

    assert Invitation.objects.exists() is False

    assert len(mail.outbox) == 1
    email = mail.outbox[0]
    assert email.to == [user.email]
    assert email.subject == "A new document was created on your behalf!"
    email_content = " ".join(email.body.split())
    assert "A new document was created on your behalf!" in email_content
    assert (
        "You have been granted ownership of a new document: My Document"
    ) in email_content


@override_settings(SERVER_TO_SERVER_API_TOKENS=["DummyToken"])
def test_api_documents_create_for_owner_new_user(mock_convert_markdown):
    """
    It should be possible to create a document on behalf of new users by
    passing only their email address.
    """
    data = {
        "title": "My Document",
        "content": "Document content",
        "sub": "123",
        "email": "john.doe@example.com",  # Should be used to create a new user
    }

    response = APIClient().post(
        "/api/v1.0/documents/create-for-owner/",
        data,
        format="json",
        HTTP_AUTHORIZATION="Bearer DummyToken",
    )

    assert response.status_code == 201

    mock_convert_markdown.assert_called_once_with("Document content")

    document = Document.objects.get()
    assert response.json() == {"id": str(document.id)}

    assert document.title == "My Document"
    assert document.content == "Converted document content"
    assert document.creator is None
    assert document.accesses.exists() is False

    invitation = Invitation.objects.get()
    assert invitation.email == "john.doe@example.com"
    assert invitation.role == "owner"

    assert len(mail.outbox) == 1
    email = mail.outbox[0]
    assert email.to == ["john.doe@example.com"]
    assert email.subject == "A new document was created on your behalf!"
    email_content = " ".join(email.body.split())
    assert "A new document was created on your behalf!" in email_content
    assert (
        "You have been granted ownership of a new document: My Document"
    ) in email_content

    # The creator field on the document should be set when the user is created
    user = User.objects.create(email="john.doe@example.com", password="!")
    document.refresh_from_db()
    assert document.creator == user


@override_settings(SERVER_TO_SERVER_API_TOKENS=["DummyToken"])
def test_api_documents_create_for_owner_with_custom_language(mock_convert_markdown):
    """
    Test creating a document with a specific language.
    Useful if the remote server knows the user's language.
    """
    data = {
        "title": "My Document",
        "content": "Document content",
        "sub": "123",
        "email": "john.doe@example.com",
        "language": "fr-fr",
    }

    response = APIClient().post(
        "/api/v1.0/documents/create-for-owner/",
        data,
        format="json",
        HTTP_AUTHORIZATION="Bearer DummyToken",
    )

    assert response.status_code == 201

    mock_convert_markdown.assert_called_once_with("Document content")

    assert len(mail.outbox) == 1
    email = mail.outbox[0]
    assert email.to == ["john.doe@example.com"]
    assert email.subject == "Un nouveau document a été créé pour vous !"
    email_content = " ".join(email.body.split())
    assert "Un nouveau document a été créé pour vous !" in email_content
    assert (
        "Vous avez été déclaré propriétaire d&#x27;un nouveau document : My Document"
    ) in email_content


@override_settings(SERVER_TO_SERVER_API_TOKENS=["DummyToken"])
def test_api_documents_create_for_owner_with_custom_subject_and_message(
    mock_convert_markdown,
):
    """It should be possible to customize the subject and message of the invitation email."""
    data = {
        "title": "My Document",
        "content": "Document content",
        "sub": "123",
        "email": "john.doe@example.com",
        "message": "mon message spécial",
        "subject": "mon sujet spécial !",
    }

    response = APIClient().post(
        "/api/v1.0/documents/create-for-owner/",
        data,
        format="json",
        HTTP_AUTHORIZATION="Bearer DummyToken",
    )

    assert response.status_code == 201

    mock_convert_markdown.assert_called_once_with("Document content")

    assert len(mail.outbox) == 1
    email = mail.outbox[0]
    assert email.to == ["john.doe@example.com"]
    assert email.subject == "Mon sujet spécial !"
    email_content = " ".join(email.body.split())
    assert "Mon sujet spécial !" in email_content
    assert "Mon message spécial" in email_content


@override_settings(SERVER_TO_SERVER_API_TOKENS=["DummyToken"])
def test_api_documents_create_for_owner_with_converter_exception(
    mock_convert_markdown,
):
    """It should be possible to customize the subject and message of the invitation email."""

    mock_convert_markdown.side_effect = ConversionError("Conversion failed")

    data = {
        "title": "My Document",
        "content": "Document content",
        "sub": "123",
        "email": "john.doe@example.com",
        "message": "mon message spécial",
        "subject": "mon sujet spécial !",
    }

    response = APIClient().post(
        "/api/v1.0/documents/create-for-owner/",
        data,
        format="json",
        HTTP_AUTHORIZATION="Bearer DummyToken",
    )

    mock_convert_markdown.assert_called_once_with("Document content")

    assert response.status_code == 500
    assert response.json() == {"detail": "could not convert content"}
