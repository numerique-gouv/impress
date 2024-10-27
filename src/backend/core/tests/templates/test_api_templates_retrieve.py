"""
Tests for Templates API endpoint in impress's core app: retrieve
"""

import pytest
from rest_framework.test import APIClient

from core import factories

pytestmark = pytest.mark.django_db


def test_api_templates_retrieve_anonymous_public():
    """Anonymous users should be allowed to retrieve public templates."""
    template = factories.TemplateFactory(is_public=True)

    response = APIClient().get(f"/api/v1.0/templates/{template.id!s}/")

    assert response.status_code == 200
    assert response.json() == {
        "id": str(template.id),
        "abilities": {
            "destroy": False,
            "generate_document": True,
            "accesses_manage": False,
            "partial_update": False,
            "retrieve": True,
            "update": False,
        },
        "accesses": [],
        "title": template.title,
        "is_public": True,
        "code": template.code,
        "css": template.css,
    }


def test_api_templates_retrieve_anonymous_not_public():
    """Anonymous users should not be able to retrieve a template that is not public."""
    template = factories.TemplateFactory(is_public=False)

    response = APIClient().get(f"/api/v1.0/templates/{template.id!s}/")

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }


def test_api_templates_retrieve_authenticated_unrelated_public():
    """
    Authenticated users should be able to retrieve a public template to which they are
    not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(is_public=True)

    response = client.get(
        f"/api/v1.0/templates/{template.id!s}/",
    )
    assert response.status_code == 200
    assert response.json() == {
        "id": str(template.id),
        "abilities": {
            "destroy": False,
            "generate_document": True,
            "accesses_manage": False,
            "partial_update": False,
            "retrieve": True,
            "update": False,
        },
        "accesses": [],
        "title": template.title,
        "is_public": True,
        "code": template.code,
        "css": template.css,
    }


def test_api_templates_retrieve_authenticated_unrelated_not_public():
    """
    Authenticated users should not be allowed to retrieve a template that is not public and
    to which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(is_public=False)

    response = client.get(
        f"/api/v1.0/templates/{template.id!s}/",
    )
    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }


def test_api_templates_retrieve_authenticated_related_direct():
    """
    Authenticated users should be allowed to retrieve a template to which they
    are directly related whatever the role.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory()
    access1 = factories.UserTemplateAccessFactory(template=template, user=user)
    access2 = factories.UserTemplateAccessFactory(template=template)

    response = client.get(
        f"/api/v1.0/templates/{template.id!s}/",
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
        "id": str(template.id),
        "title": template.title,
        "abilities": template.get_abilities(user),
        "is_public": template.is_public,
        "code": template.code,
        "css": template.css,
    }


def test_api_templates_retrieve_authenticated_related_team_none(mock_user_teams):
    """
    Authenticated users should not be able to retrieve a template related to teams in
    which the user is not.
    """
    mock_user_teams.return_value = []

    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(is_public=False)

    factories.TeamTemplateAccessFactory(
        template=template, team="readers", role="reader"
    )
    factories.TeamTemplateAccessFactory(
        template=template, team="editors", role="editor"
    )
    factories.TeamTemplateAccessFactory(
        template=template, team="administrators", role="administrator"
    )
    factories.TeamTemplateAccessFactory(template=template, team="owners", role="owner")
    factories.TeamTemplateAccessFactory(template=template)
    factories.TeamTemplateAccessFactory()

    response = client.get(f"/api/v1.0/templates/{template.id!s}/")
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
def test_api_templates_retrieve_authenticated_related_team_readers_or_editors(
    teams, mock_user_teams
):
    """
    Authenticated users should be allowed to retrieve a template to which they
    are related via a team whatever the role and see all its accesses.
    """
    mock_user_teams.return_value = teams

    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(is_public=False)

    access_reader = factories.TeamTemplateAccessFactory(
        template=template, team="readers", role="reader"
    )
    access_editor = factories.TeamTemplateAccessFactory(
        template=template, team="editors", role="editor"
    )
    access_administrator = factories.TeamTemplateAccessFactory(
        template=template, team="administrators", role="administrator"
    )
    access_owner = factories.TeamTemplateAccessFactory(
        template=template, team="owners", role="owner"
    )
    other_access = factories.TeamTemplateAccessFactory(template=template)
    factories.TeamTemplateAccessFactory()

    response = client.get(f"/api/v1.0/templates/{template.id!s}/")
    assert response.status_code == 200
    content = response.json()
    expected_abilities = {
        "destroy": False,
        "retrieve": True,
        "set_role_to": [],
        "update": False,
        "partial_update": False,
    }
    assert sorted(content.pop("accesses"), key=lambda x: x["id"]) == sorted(
        [
            {
                "id": str(access_reader.id),
                "user": None,
                "team": "readers",
                "role": access_reader.role,
                "abilities": expected_abilities,
            },
            {
                "id": str(access_editor.id),
                "user": None,
                "team": "editors",
                "role": access_editor.role,
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
        "id": str(template.id),
        "title": template.title,
        "abilities": template.get_abilities(user),
        "is_public": False,
        "code": template.code,
        "css": template.css,
    }


@pytest.mark.parametrize(
    "teams",
    [
        ["administrators"],
        ["members", "administrators"],
        ["unknown", "administrators"],
    ],
)
def test_api_templates_retrieve_authenticated_related_team_administrators(
    teams, mock_user_teams
):
    """
    Authenticated users should be allowed to retrieve a template to which they
    are related via a team whatever the role and see all its accesses.
    """
    mock_user_teams.return_value = teams

    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(is_public=False)

    access_reader = factories.TeamTemplateAccessFactory(
        template=template, team="readers", role="reader"
    )
    access_editor = factories.TeamTemplateAccessFactory(
        template=template, team="editors", role="editor"
    )
    access_administrator = factories.TeamTemplateAccessFactory(
        template=template, team="administrators", role="administrator"
    )
    access_owner = factories.TeamTemplateAccessFactory(
        template=template, team="owners", role="owner"
    )
    other_access = factories.TeamTemplateAccessFactory(template=template)
    factories.TeamTemplateAccessFactory()

    response = client.get(f"/api/v1.0/templates/{template.id!s}/")

    assert response.status_code == 200
    content = response.json()
    assert sorted(content.pop("accesses"), key=lambda x: x["id"]) == sorted(
        [
            {
                "id": str(access_reader.id),
                "user": None,
                "team": "readers",
                "role": "reader",
                "abilities": {
                    "destroy": True,
                    "retrieve": True,
                    "set_role_to": ["administrator", "editor"],
                    "update": True,
                    "partial_update": True,
                },
            },
            {
                "id": str(access_editor.id),
                "user": None,
                "team": "editors",
                "role": "editor",
                "abilities": {
                    "destroy": True,
                    "retrieve": True,
                    "set_role_to": ["administrator", "reader"],
                    "update": True,
                    "partial_update": True,
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
                    "set_role_to": ["editor", "reader"],
                    "update": True,
                    "partial_update": True,
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
                    "partial_update": False,
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
        "id": str(template.id),
        "title": template.title,
        "abilities": template.get_abilities(user),
        "is_public": False,
        "code": template.code,
        "css": template.css,
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
def test_api_templates_retrieve_authenticated_related_team_owners(
    teams, mock_user_teams
):
    """
    Authenticated users should be allowed to retrieve a template to which they
    are related via a team whatever the role and see all its accesses.
    """
    mock_user_teams.return_value = teams

    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(is_public=False)

    access_reader = factories.TeamTemplateAccessFactory(
        template=template, team="readers", role="reader"
    )
    access_editor = factories.TeamTemplateAccessFactory(
        template=template, team="editors", role="editor"
    )
    access_administrator = factories.TeamTemplateAccessFactory(
        template=template, team="administrators", role="administrator"
    )
    access_owner = factories.TeamTemplateAccessFactory(
        template=template, team="owners", role="owner"
    )
    other_access = factories.TeamTemplateAccessFactory(template=template)
    factories.TeamTemplateAccessFactory()

    response = client.get(f"/api/v1.0/templates/{template.id!s}/")

    assert response.status_code == 200
    content = response.json()
    assert sorted(content.pop("accesses"), key=lambda x: x["id"]) == sorted(
        [
            {
                "id": str(access_reader.id),
                "user": None,
                "team": "readers",
                "role": "reader",
                "abilities": {
                    "destroy": True,
                    "retrieve": True,
                    "set_role_to": ["owner", "administrator", "editor"],
                    "update": True,
                    "partial_update": True,
                },
            },
            {
                "id": str(access_editor.id),
                "user": None,
                "team": "editors",
                "role": "editor",
                "abilities": {
                    "destroy": True,
                    "retrieve": True,
                    "set_role_to": ["owner", "administrator", "reader"],
                    "update": True,
                    "partial_update": True,
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
                    "set_role_to": ["owner", "editor", "reader"],
                    "update": True,
                    "partial_update": True,
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
                    "set_role_to": ["administrator", "editor", "reader"]
                    if other_access.role == "owner"
                    else [],
                    "update": other_access.role == "owner",
                    "partial_update": other_access.role == "owner",
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
        "id": str(template.id),
        "title": template.title,
        "abilities": template.get_abilities(user),
        "is_public": False,
        "code": template.code,
        "css": template.css,
    }
