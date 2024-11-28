"""
Tests for Documents API endpoint in impress's core app: retrieve
"""

import pytest
from rest_framework.test import APIClient

from core import factories, models
from core.api import serializers

pytestmark = pytest.mark.django_db


def test_api_documents_retrieve_anonymous_public():
    """Anonymous users should be allowed to retrieve public documents."""
    document = factories.DocumentFactory(link_reach="public")

    response = APIClient().get(f"/api/v1.0/documents/{document.id!s}/")

    assert response.status_code == 200
    assert response.json() == {
        "id": str(document.id),
        "abilities": {
            "accesses_manage": False,
            "accesses_view": False,
            "ai_transform": document.link_role == "editor",
            "ai_translate": document.link_role == "editor",
            "attachment_upload": document.link_role == "editor",
            "destroy": False,
            "invite_owner": False,
            "link_configuration": False,
            "partial_update": document.link_role == "editor",
            "retrieve": True,
            "update": document.link_role == "editor",
            "versions_destroy": False,
            "versions_list": False,
            "versions_retrieve": False,
        },
        "content": document.content,
        "created_at": document.created_at.isoformat().replace("+00:00", "Z"),
        "is_user_favorite": False,
        "link_reach": "public",
        "link_role": document.link_role,
        "title": document.title,
        "updated_at": document.updated_at.isoformat().replace("+00:00", "Z"),
    }


@pytest.mark.parametrize("reach", ["restricted", "authenticated"])
def test_api_documents_retrieve_anonymous_restricted_or_authenticated(reach):
    """Anonymous users should not be able to retrieve a document that is not public."""
    document = factories.DocumentFactory(link_reach=reach)

    response = APIClient().get(f"/api/v1.0/documents/{document.id!s}/")

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }


@pytest.mark.parametrize("reach", ["public", "authenticated"])
def test_api_documents_retrieve_authenticated_unrelated_public_or_authenticated(reach):
    """
    Authenticated users should be able to retrieve a public document to which they are
    not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(link_reach=reach)

    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/",
    )
    assert response.status_code == 200
    assert response.json() == {
        "id": str(document.id),
        "abilities": {
            "accesses_manage": False,
            "accesses_view": False,
            "ai_transform": document.link_role == "editor",
            "ai_translate": document.link_role == "editor",
            "attachment_upload": document.link_role == "editor",
            "link_configuration": False,
            "destroy": False,
            "invite_owner": False,
            "partial_update": document.link_role == "editor",
            "retrieve": True,
            "update": document.link_role == "editor",
            "versions_destroy": False,
            "versions_list": False,
            "versions_retrieve": False,
        },
        "is_user_favorite": False,
        "link_reach": reach,
        "link_role": document.link_role,
        "title": document.title,
        "content": document.content,
        "created_at": document.created_at.isoformat().replace("+00:00", "Z"),
        "updated_at": document.updated_at.isoformat().replace("+00:00", "Z"),
    }
    assert (
        models.LinkTrace.objects.filter(document=document, user=user).exists() is True
    )


@pytest.mark.parametrize("reach", ["public", "authenticated"])
def test_api_documents_retrieve_authenticated_trace_twice(reach):
    """
    Accessing a document several times should not raise any error even though the
    trace already exists for this document and user.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(link_reach=reach)
    assert (
        models.LinkTrace.objects.filter(document=document, user=user).exists() is False
    )

    client.get(
        f"/api/v1.0/documents/{document.id!s}/",
    )
    assert (
        models.LinkTrace.objects.filter(document=document, user=user).exists() is True
    )

    # A second visit should not raise any error
    response = client.get(f"/api/v1.0/documents/{document.id!s}/")

    assert response.status_code == 200


def test_api_documents_retrieve_authenticated_unrelated_restricted():
    """
    Authenticated users should not be allowed to retrieve a document that is restricted and
    to which they are not related.
    """
    user = factories.UserFactory(with_owned_document=True)

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(link_reach="restricted")

    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/",
    )
    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }


def test_api_documents_retrieve_authenticated_related_direct():
    """
    Authenticated users should be allowed to retrieve a document to which they
    are directly related whatever the role.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    factories.UserDocumentAccessFactory(document=document, user=user)
    access2 = factories.UserDocumentAccessFactory(document=document)
    serializers.UserSerializer(instance=user)
    serializers.UserSerializer(instance=access2.user)

    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/",
    )
    assert response.status_code == 200
    assert response.json() == {
        "id": str(document.id),
        "title": document.title,
        "content": document.content,
        "abilities": document.get_abilities(user),
        "link_reach": document.link_reach,
        "link_role": document.link_role,
        "created_at": document.created_at.isoformat().replace("+00:00", "Z"),
        "updated_at": document.updated_at.isoformat().replace("+00:00", "Z"),
    }


def test_api_documents_retrieve_authenticated_related_team_none(mock_user_teams):
    """
    Authenticated users should not be able to retrieve a restricted document related to
    teams in which the user is not.
    """
    mock_user_teams.return_value = []

    user = factories.UserFactory(with_owned_document=True)

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(link_reach="restricted")

    factories.TeamDocumentAccessFactory(
        document=document, team="readers", role="reader"
    )
    factories.TeamDocumentAccessFactory(
        document=document, team="editors", role="editor"
    )
    factories.TeamDocumentAccessFactory(
        document=document, team="administrators", role="administrator"
    )
    factories.TeamDocumentAccessFactory(document=document, team="owners", role="owner")
    factories.TeamDocumentAccessFactory(document=document)
    factories.TeamDocumentAccessFactory()

    response = client.get(f"/api/v1.0/documents/{document.id!s}/")
    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }


@pytest.mark.parametrize(
    "teams",
    [
        ["readers"],
        ["unknown", "readers"],
        ["editors"],
        ["unknown", "editors"],
    ],
)
def test_api_documents_retrieve_authenticated_related_team_members(
    teams, mock_user_teams
):
    """
    Authenticated users should be allowed to retrieve a document to which they
    are related via a team whatever the role.
    """
    mock_user_teams.return_value = teams

    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(link_reach="restricted")

    factories.TeamDocumentAccessFactory(
        document=document, team="readers", role="reader"
    )
    factories.TeamDocumentAccessFactory(
        document=document, team="editors", role="editor"
    )
    factories.TeamDocumentAccessFactory(
        document=document, team="administrators", role="administrator"
    )
    factories.TeamDocumentAccessFactory(document=document, team="owners", role="owner")
    factories.TeamDocumentAccessFactory(document=document)
    factories.TeamDocumentAccessFactory()

    response = client.get(f"/api/v1.0/documents/{document.id!s}/")

    # pylint: disable=R0801
    assert response.status_code == 200
    assert response.json() == {
        "id": str(document.id),
        "title": document.title,
        "content": document.content,
        "abilities": document.get_abilities(user),
        "link_reach": "restricted",
        "link_role": document.link_role,
        "created_at": document.created_at.isoformat().replace("+00:00", "Z"),
        "updated_at": document.updated_at.isoformat().replace("+00:00", "Z"),
    }


@pytest.mark.parametrize(
    "teams",
    [
        ["administrators"],
        ["editors", "administrators"],
        ["unknown", "administrators"],
    ],
)
def test_api_documents_retrieve_authenticated_related_team_administrators(
    teams, mock_user_teams
):
    """
    Authenticated users should be allowed to retrieve a document to which they
    are related via a team whatever the role.
    """
    mock_user_teams.return_value = teams

    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(link_reach="restricted")

    factories.TeamDocumentAccessFactory(
        document=document, team="readers", role="reader"
    )
    factories.TeamDocumentAccessFactory(
        document=document, team="editors", role="editor"
    )
    factories.TeamDocumentAccessFactory(
        document=document, team="administrators", role="administrator"
    )
    factories.TeamDocumentAccessFactory(document=document, team="owners", role="owner")
    factories.TeamDocumentAccessFactory(document=document)
    factories.TeamDocumentAccessFactory()

    response = client.get(f"/api/v1.0/documents/{document.id!s}/")

    # pylint: disable=R0801
    assert response.status_code == 200
    assert response.json() == {
        "id": str(document.id),
        "title": document.title,
        "content": document.content,
        "abilities": document.get_abilities(user),
        "link_reach": "restricted",
        "link_role": document.link_role,
        "created_at": document.created_at.isoformat().replace("+00:00", "Z"),
        "updated_at": document.updated_at.isoformat().replace("+00:00", "Z"),
    }


@pytest.mark.parametrize(
    "teams",
    [
        ["owners"],
        ["owners", "administrators"],
        ["members", "administrators", "owners"],
        ["unknown", "owners"],
    ],
)
def test_api_documents_retrieve_authenticated_related_team_owners(
    teams, mock_user_teams
):
    """
    Authenticated users should be allowed to retrieve a restricted document to which
    they are related via a team whatever the role.
    """
    mock_user_teams.return_value = teams

    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(link_reach="restricted")

    factories.TeamDocumentAccessFactory(
        document=document, team="readers", role="reader"
    )
    factories.TeamDocumentAccessFactory(
        document=document, team="editors", role="editor"
    )
    factories.TeamDocumentAccessFactory(
        document=document, team="administrators", role="administrator"
    )
    factories.TeamDocumentAccessFactory(document=document, team="owners", role="owner")
    factories.TeamDocumentAccessFactory(document=document)
    factories.TeamDocumentAccessFactory()

    response = client.get(f"/api/v1.0/documents/{document.id!s}/")

    # pylint: disable=R0801
    assert response.status_code == 200
    assert response.json() == {
        "id": str(document.id),
        "title": document.title,
        "content": document.content,
        "abilities": document.get_abilities(user),
        "link_reach": "restricted",
        "link_role": document.link_role,
        "created_at": document.created_at.isoformat().replace("+00:00", "Z"),
        "updated_at": document.updated_at.isoformat().replace("+00:00", "Z"),
    }
