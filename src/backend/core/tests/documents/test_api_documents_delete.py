"""
Tests for Documents API endpoint in impress's core app: delete
"""

import random

import pytest
from rest_framework.test import APIClient

from core import factories, models
from core.tests.conftest import TEAM, USER, VIA

pytestmark = pytest.mark.django_db


def test_api_documents_delete_anonymous():
    """Anonymous users should not be allowed to destroy a document."""
    document = factories.DocumentFactory()

    response = APIClient().delete(
        f"/api/v1.0/documents/{document.id!s}/",
    )

    assert response.status_code == 401
    assert models.Document.objects.count() == 1


def test_api_documents_delete_authenticated_unrelated():
    """
    Authenticated users should not be allowed to delete a document to which they are not
    related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    is_public = random.choice([True, False])
    document = factories.DocumentFactory(is_public=is_public)

    response = client.delete(
        f"/api/v1.0/documents/{document.id!s}/",
    )

    assert response.status_code == 403 if is_public else 404
    assert models.Document.objects.count() == 1


@pytest.mark.parametrize("role", ["reader", "editor", "administrator"])
@pytest.mark.parametrize("via", VIA)
def test_api_documents_delete_authenticated_not_owner(via, role, mock_user_get_teams):
    """
    Authenticated users should not be allowed to delete a document for which they are
    only a reader, editor or administrator.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role=role)
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role=role
        )

    response = client.delete(
        f"/api/v1.0/documents/{document.id}/",
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }
    assert models.Document.objects.count() == 1


@pytest.mark.parametrize("via", VIA)
def test_api_documents_delete_authenticated_owner(via, mock_user_get_teams):
    """
    Authenticated users should be able to delete a document they own.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role="owner")
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role="owner"
        )

    response = client.delete(
        f"/api/v1.0/documents/{document.id}/",
    )

    assert response.status_code == 204
    assert models.Document.objects.exists() is False
