"""Tests for link configuration of documents on API endpoint"""

import pytest
from rest_framework.test import APIClient

from core import factories, models
from core.api import serializers
from core.tests.conftest import TEAM, USER, VIA
from core.tests.test_services_collaboration_services import (  # pylint: disable=unused-import
    mock_reset_connections,
)

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize("role", models.LinkRoleChoices.values)
@pytest.mark.parametrize("reach", models.LinkReachChoices.values)
def test_api_documents_link_configuration_update_anonymous(reach, role):
    """Anonymous users should not be allowed to update a link configuration."""
    document = factories.DocumentFactory(link_reach=reach, link_role=role)
    old_document_values = serializers.LinkDocumentSerializer(instance=document).data

    new_document_values = serializers.LinkDocumentSerializer(
        instance=factories.DocumentFactory()
    ).data
    response = APIClient().put(
        f"/api/v1.0/documents/{document.id!s}/link-configuration/",
        new_document_values,
        format="json",
    )
    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }

    document.refresh_from_db()
    document_values = serializers.LinkDocumentSerializer(instance=document).data
    assert document_values == old_document_values


@pytest.mark.parametrize("role", models.LinkRoleChoices.values)
@pytest.mark.parametrize("reach", models.LinkReachChoices.values)
def test_api_documents_link_configuration_update_authenticated_unrelated(reach, role):
    """
    Authenticated users should not be allowed to update the link configuration for
    a document to which they are not related.
    """
    user = factories.UserFactory(with_owned_document=True)

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(link_reach=reach, link_role=role)
    old_document_values = serializers.LinkDocumentSerializer(instance=document).data

    new_document_values = serializers.LinkDocumentSerializer(
        instance=factories.DocumentFactory()
    ).data
    response = client.put(
        f"/api/v1.0/documents/{document.id!s}/link-configuration/",
        new_document_values,
        format="json",
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }

    document.refresh_from_db()
    document_values = serializers.LinkDocumentSerializer(instance=document).data
    assert document_values == old_document_values


@pytest.mark.parametrize("role", ["editor", "reader"])
@pytest.mark.parametrize("via", VIA)
def test_api_documents_link_configuration_update_authenticated_related_forbidden(
    via, role, mock_user_teams
):
    """
    Users who are readers or editors of a document should not be allowed to update
    the link configuration.
    """
    user = factories.UserFactory(with_owned_document=True)

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

    old_document_values = serializers.LinkDocumentSerializer(instance=document).data

    new_document_values = serializers.LinkDocumentSerializer(
        instance=factories.DocumentFactory()
    ).data
    response = client.put(
        f"/api/v1.0/documents/{document.id!s}/link-configuration/",
        new_document_values,
        format="json",
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }

    document.refresh_from_db()
    document_values = serializers.LinkDocumentSerializer(instance=document).data
    assert document_values == old_document_values


@pytest.mark.parametrize("role", ["administrator", "owner"])
@pytest.mark.parametrize("via", VIA)
def test_api_documents_link_configuration_update_authenticated_related_success(
    via,
    role,
    mock_user_teams,
    mock_reset_connections,  # pylint: disable=redefined-outer-name
):
    """
    A user who is administrator or owner of a document should be allowed to update
    the link configuration.
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

    new_document_values = serializers.LinkDocumentSerializer(
        instance=factories.DocumentFactory()
    ).data

    with mock_reset_connections(document.id):
        response = client.put(
            f"/api/v1.0/documents/{document.id!s}/link-configuration/",
            new_document_values,
            format="json",
        )
        assert response.status_code == 200

        document = models.Document.objects.get(pk=document.pk)
        document_values = serializers.LinkDocumentSerializer(instance=document).data
        for key, value in document_values.items():
            assert value == new_document_values[key]
