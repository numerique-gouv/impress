"""
Tests for Documents API endpoint in impress's core app: create
"""

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


def test_api_documents_create_authenticated():
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
    assert document.accesses.filter(role="owner", user=user).exists()
