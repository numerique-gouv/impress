"""
Tests for Documents API endpoint in impress's core app: retrieve
"""
import pytest
from rest_framework.test import APIClient

from core import factories

pytestmark = pytest.mark.django_db


def test_api_documents_retrieve_anonymous_public():
    """Anonymous users should be allowed to retrieve public documents."""
    document = factories.DocumentFactory(is_public=True)

    response = APIClient().get(f"/api/v1.0/documents/{document.id!s}/")

    assert response.status_code == 200
    assert response.json() == {
        "id": str(document.id),
        "abilities": {
            "destroy": False,
            "manage_accesses": False,
            "partial_update": False,
            "retrieve": True,
            "update": False,
        },
        "accesses": [],
        "title": document.title,
        "is_public": True,
    }


def test_api_documents_retrieve_anonymous_not_public():
    """Anonymous users should not be able to retrieve a document that is not public."""
    document = factories.DocumentFactory(is_public=False)

    response = APIClient().get(f"/api/v1.0/documents/{document.id!s}/")

    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}


def test_api_documents_retrieve_authenticated_unrelated_public():
    """
    Authenticated users should be able to retrieve a public document to which they are
    not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(is_public=True)

    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/",
    )
    assert response.status_code == 200
    assert response.json() == {
        "id": str(document.id),
        "abilities": {
            "destroy": False,
            "manage_accesses": False,
            "partial_update": False,
            "retrieve": True,
            "update": False,
        },
        "accesses": [],
        "title": document.title,
        "is_public": True,
    }


def test_api_documents_retrieve_authenticated_unrelated_not_public():
    """
    Authenticated users should not be allowed to retrieve a document that is not public and
    to which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(is_public=False)

    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/",
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}


def test_api_documents_retrieve_authenticated_related_direct():
    """
    Authenticated users should be allowed to retrieve a document to which they
    are directly related whatever the role.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    access1 = factories.UserDocumentAccessFactory(document=document, user=user)
    access2 = factories.UserDocumentAccessFactory(document=document)

    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/",
    )
    assert response.status_code == 200
    content = response.json()
    assert sorted(content.pop("accesses"), key=lambda x: x["user"]) == sorted(
        [
            {
                "id": str(access1.id),
                "user": str(user.id),
                "team": "",
                "role": access1.role,
                "abilities": access1.get_abilities(user),
            },
            {
                "id": str(access2.id),
                "user": str(access2.user.id),
                "team": "",
                "role": access2.role,
                "abilities": access2.get_abilities(user),
            },
        ],
        key=lambda x: x["user"],
    )
    assert response.json() == {
        "id": str(document.id),
        "title": document.title,
        "abilities": document.get_abilities(user),
        "is_public": document.is_public,
    }


def test_api_documents_retrieve_authenticated_related_team_none(mock_user_get_teams):
    """
    Authenticated users should not be able to retrieve a document related to teams in
    which the user is not.
    """
    mock_user_get_teams.return_value = []

    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(is_public=False)

    factories.TeamDocumentAccessFactory(
        document=document, team="members", role="member"
    )
    factories.TeamDocumentAccessFactory(
        document=document, team="administrators", role="administrator"
    )
    factories.TeamDocumentAccessFactory(document=document, team="owners", role="owner")
    factories.TeamDocumentAccessFactory(document=document)
    factories.TeamDocumentAccessFactory()

    response = client.get(f"/api/v1.0/documents/{document.id!s}/")
    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}


@pytest.mark.parametrize(
    "teams",
    [
        ["members"],
        ["unknown", "members"],
    ],
)
def test_api_documents_retrieve_authenticated_related_team_members(
    teams, mock_user_get_teams
):
    """
    Authenticated users should be allowed to retrieve a document to which they
    are related via a team whatever the role and see all its accesses.
    """
    mock_user_get_teams.return_value = teams

    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(is_public=False)

    access_member = factories.TeamDocumentAccessFactory(
        document=document, team="members", role="member"
    )
    access_administrator = factories.TeamDocumentAccessFactory(
        document=document, team="administrators", role="administrator"
    )
    access_owner = factories.TeamDocumentAccessFactory(
        document=document, team="owners", role="owner"
    )
    other_access = factories.TeamDocumentAccessFactory(document=document)
    factories.TeamDocumentAccessFactory()

    response = client.get(f"/api/v1.0/documents/{document.id!s}/")
    assert response.status_code == 200
    content = response.json()
    expected_abilities = {
        "destroy": False,
        "retrieve": True,
        "set_role_to": [],
        "update": False,
    }
    assert sorted(content.pop("accesses"), key=lambda x: x["id"]) == sorted(
        [
            {
                "id": str(access_member.id),
                "user": None,
                "team": "members",
                "role": access_member.role,
                "abilities": expected_abilities,
            },
            {
                "id": str(access_administrator.id),
                "user": None,
                "team": "administrators",
                "role": access_administrator.role,
                "abilities": expected_abilities,
            },
            {
                "id": str(access_owner.id),
                "user": None,
                "team": "owners",
                "role": access_owner.role,
                "abilities": expected_abilities,
            },
            {
                "id": str(other_access.id),
                "user": None,
                "team": other_access.team,
                "role": other_access.role,
                "abilities": expected_abilities,
            },
        ],
        key=lambda x: x["id"],
    )
    assert response.json() == {
        "id": str(document.id),
        "title": document.title,
        "abilities": document.get_abilities(user),
        "is_public": False,
    }


@pytest.mark.parametrize(
    "teams",
    [
        ["administrators"],
        ["members", "administrators"],
        ["unknown", "administrators"],
    ],
)
def test_api_documents_retrieve_authenticated_related_team_administrators(
    teams, mock_user_get_teams
):
    """
    Authenticated users should be allowed to retrieve a document to which they
    are related via a team whatever the role and see all its accesses.
    """
    mock_user_get_teams.return_value = teams

    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(is_public=False)

    access_member = factories.TeamDocumentAccessFactory(
        document=document, team="members", role="member"
    )
    access_administrator = factories.TeamDocumentAccessFactory(
        document=document, team="administrators", role="administrator"
    )
    access_owner = factories.TeamDocumentAccessFactory(
        document=document, team="owners", role="owner"
    )
    other_access = factories.TeamDocumentAccessFactory(document=document)
    factories.TeamDocumentAccessFactory()

    response = client.get(f"/api/v1.0/documents/{document.id!s}/")

    # pylint: disable=R0801
    assert response.status_code == 200
    content = response.json()
    assert sorted(content.pop("accesses"), key=lambda x: x["id"]) == sorted(
        [
            {
                "id": str(access_member.id),
                "user": None,
                "team": "members",
                "role": "member",
                "abilities": {
                    "destroy": True,
                    "retrieve": True,
                    "set_role_to": ["administrator"],
                    "update": True,
                },
            },
            {
                "id": str(access_administrator.id),
                "user": None,
                "team": "administrators",
                "role": "administrator",
                "abilities": {
                    "destroy": True,
                    "retrieve": True,
                    "set_role_to": ["member"],
                    "update": True,
                },
            },
            {
                "id": str(access_owner.id),
                "user": None,
                "team": "owners",
                "role": "owner",
                "abilities": {
                    "destroy": False,
                    "retrieve": True,
                    "set_role_to": [],
                    "update": False,
                },
            },
            {
                "id": str(other_access.id),
                "user": None,
                "team": other_access.team,
                "role": other_access.role,
                "abilities": other_access.get_abilities(user),
            },
        ],
        key=lambda x: x["id"],
    )
    assert response.json() == {
        "id": str(document.id),
        "title": document.title,
        "abilities": document.get_abilities(user),
        "is_public": False,
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
    teams, mock_user_get_teams
):
    """
    Authenticated users should be allowed to retrieve a document to which they
    are related via a team whatever the role and see all its accesses.
    """
    mock_user_get_teams.return_value = teams

    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(is_public=False)

    access_member = factories.TeamDocumentAccessFactory(
        document=document, team="members", role="member"
    )
    access_administrator = factories.TeamDocumentAccessFactory(
        document=document, team="administrators", role="administrator"
    )
    access_owner = factories.TeamDocumentAccessFactory(
        document=document, team="owners", role="owner"
    )
    other_access = factories.TeamDocumentAccessFactory(document=document)
    factories.TeamDocumentAccessFactory()

    response = client.get(f"/api/v1.0/documents/{document.id!s}/")

    # pylint: disable=R0801
    assert response.status_code == 200
    content = response.json()
    assert sorted(content.pop("accesses"), key=lambda x: x["id"]) == sorted(
        [
            {
                "id": str(access_member.id),
                "user": None,
                "team": "members",
                "role": "member",
                "abilities": {
                    "destroy": True,
                    "retrieve": True,
                    "set_role_to": ["owner", "administrator"],
                    "update": True,
                },
            },
            {
                "id": str(access_administrator.id),
                "user": None,
                "team": "administrators",
                "role": "administrator",
                "abilities": {
                    "destroy": True,
                    "retrieve": True,
                    "set_role_to": ["owner", "member"],
                    "update": True,
                },
            },
            {
                "id": str(access_owner.id),
                "user": None,
                "team": "owners",
                "role": "owner",
                "abilities": {
                    # editable only if there is another owner role than the user's team...
                    "destroy": other_access.role == "owner",
                    "retrieve": True,
                    "set_role_to": ["administrator", "member"]
                    if other_access.role == "owner"
                    else [],
                    "update": other_access.role == "owner",
                },
            },
            {
                "id": str(other_access.id),
                "user": None,
                "team": other_access.team,
                "role": other_access.role,
                "abilities": other_access.get_abilities(user),
            },
        ],
        key=lambda x: x["id"],
    )
    assert response.json() == {
        "id": str(document.id),
        "title": document.title,
        "abilities": document.get_abilities(user),
        "is_public": False,
    }
