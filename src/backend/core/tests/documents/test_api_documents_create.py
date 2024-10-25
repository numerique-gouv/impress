"""
Tests for Documents API endpoint in impress's core app: create
"""

from uuid import uuid4

import pytest
from rest_framework.test import APIClient

from core import factories
from core.models import Document

pytestmark = pytest.mark.django_db


def test_api_documents_create_anonymous():
    """Anonymous users should not be allowed to create documents."""
    response = APIClient().post(
        "/api/v1.0/documents/",
        {
            "title": "my document",
        },
    )

    assert response.status_code == 401
    assert not Document.objects.exists()


def test_api_documents_create_authenticated_success():
    """
    Authenticated users should be able to create documents and should automatically be declared
    as the owner of the newly created document.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    response = client.post(
        "/api/v1.0/documents/",
        {
            "title": "my document",
        },
        format="json",
    )

    assert response.status_code == 201
    document = Document.objects.get()
    assert document.title == "my document"
    assert document.link_reach == "restricted"
    assert document.accesses.filter(role="owner", user=user).exists()


def test_api_documents_create_authenticated_title_null():
    """It should be possible to create several documents with a null title."""
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    factories.DocumentFactory(title=None)

    response = client.post("/api/v1.0/documents/", {}, format="json")

    assert response.status_code == 201
    assert Document.objects.filter(title__isnull=True).count() == 2


def test_api_documents_create_force_id_success():
    """It should be possible to force the document ID when creating a document."""
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    forced_id = uuid4()

    response = client.post(
        "/api/v1.0/documents/",
        {
            "id": str(forced_id),
            "title": "my document",
        },
        format="json",
    )

    assert response.status_code == 201
    documents = Document.objects.all()
    assert len(documents) == 1
    assert documents[0].id == forced_id


def test_api_documents_create_force_id_existing():
    """
    It should not be possible to use the ID of an existing document when forcing ID on creation.
    """
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()

    response = client.post(
        "/api/v1.0/documents/",
        {
            "id": str(document.id),
            "title": "my document",
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.json() == {
        "id": ["A document with this ID already exists. You cannot override it."]
    }
