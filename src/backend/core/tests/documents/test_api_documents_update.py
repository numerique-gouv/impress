"""
Tests for Documents API endpoint in impress's core app: update
"""
import random

import pytest
from rest_framework.test import APIClient

from core import factories
from core.api import serializers
from core.tests.conftest import TEAM, USER, VIA

pytestmark = pytest.mark.django_db


def test_api_documents_update_anonymous():
    """Anonymous users should not be allowed to update a document."""
    document = factories.DocumentFactory()
    old_document_values = serializers.DocumentSerializer(instance=document).data

    new_document_values = serializers.DocumentSerializer(
        instance=factories.DocumentFactory()
    ).data
    response = APIClient().put(
        f"/api/v1.0/documents/{document.id!s}/",
        new_document_values,
        format="json",
    )
    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }

    document.refresh_from_db()
    document_values = serializers.DocumentSerializer(instance=document).data
    assert document_values == old_document_values


def test_api_documents_update_authenticated_unrelated():
    """
    Authenticated users should not be allowed to update a document to which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(is_public=False)
    old_document_values = serializers.DocumentSerializer(instance=document).data

    new_document_values = serializers.DocumentSerializer(
        instance=factories.DocumentFactory()
    ).data
    response = client.put(
        f"/api/v1.0/documents/{document.id!s}/",
        new_document_values,
        format="json",
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}

    document.refresh_from_db()
    document_values = serializers.DocumentSerializer(instance=document).data
    assert document_values == old_document_values


@pytest.mark.parametrize("via", VIA)
def test_api_documents_update_authenticated_members(via, mock_user_get_teams):
    """
    Users who are members of a document but not administrators should
    not be allowed to update it.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role="member")
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role="member"
        )

    old_document_values = serializers.DocumentSerializer(instance=document).data

    new_document_values = serializers.DocumentSerializer(
        instance=factories.DocumentFactory()
    ).data
    response = client.put(
        f"/api/v1.0/documents/{document.id!s}/",
        new_document_values,
        format="json",
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }

    document.refresh_from_db()
    document_values = serializers.DocumentSerializer(instance=document).data
    assert document_values == old_document_values


@pytest.mark.parametrize("role", ["administrator", "owner"])
@pytest.mark.parametrize("via", VIA)
def test_api_documents_update_authenticated_administrator_or_owner(
    via, role, mock_user_get_teams
):
    """Administrator or owner of a document should be allowed to update it."""
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

    old_document_values = serializers.DocumentSerializer(instance=document).data

    new_document_values = serializers.DocumentSerializer(
        instance=factories.DocumentFactory()
    ).data
    response = client.put(
        f"/api/v1.0/documents/{document.id!s}/",
        new_document_values,
        format="json",
    )
    assert response.status_code == 200

    document.refresh_from_db()
    document_values = serializers.DocumentSerializer(instance=document).data
    for key, value in document_values.items():
        if key in ["id", "accesses"]:
            assert value == old_document_values[key]
        else:
            assert value == new_document_values[key]


@pytest.mark.parametrize("via", VIA)
def test_api_documents_update_authenticated_owners(via, mock_user_get_teams):
    """Administrators of a document should be allowed to update it."""
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

    old_document_values = serializers.DocumentSerializer(instance=document).data

    new_document_values = serializers.DocumentSerializer(
        instance=factories.DocumentFactory()
    ).data

    response = client.put(
        f"/api/v1.0/documents/{document.id!s}/", new_document_values, format="json"
    )

    assert response.status_code == 200
    document.refresh_from_db()
    document_values = serializers.DocumentSerializer(instance=document).data
    for key, value in document_values.items():
        if key in ["id", "accesses"]:
            assert value == old_document_values[key]
        else:
            assert value == new_document_values[key]


@pytest.mark.parametrize("via", VIA)
def test_api_documents_update_administrator_or_owner_of_another(
    via, mock_user_get_teams
):
    """
    Being administrator or owner of a document should not grant authorization to update
    another document.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(
            document=document, user=user, role=random.choice(["administrator", "owner"])
        )
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document,
            team="lasuite",
            role=random.choice(["administrator", "owner"]),
        )

    is_public = random.choice([True, False])
    document = factories.DocumentFactory(title="Old title", is_public=is_public)
    old_document_values = serializers.DocumentSerializer(instance=document).data

    new_document_values = serializers.DocumentSerializer(
        instance=factories.DocumentFactory()
    ).data
    response = client.put(
        f"/api/v1.0/documents/{document.id!s}/",
        new_document_values,
        format="json",
    )

    assert response.status_code == 403 if is_public else 404

    document.refresh_from_db()
    document_values = serializers.DocumentSerializer(instance=document).data
    assert document_values == old_document_values
