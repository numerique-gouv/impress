"""
Unit tests for the TeamAccess model
"""
from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ValidationError

import pytest

from core import factories

pytestmark = pytest.mark.django_db


def test_models_team_accesses_str():
    """
    The str representation should include user name, team full name and role.
    """
    contact = factories.ContactFactory(full_name="David Bowman")
    user = contact.owner
    user.profile_contact = contact
    user.save()
    access = factories.TeamAccessFactory(
        role="member",
        user=user,
        team__name="admins",
    )
    assert str(access) == "David Bowman is member in team admins"


def test_models_team_accesses_unique():
    """Team accesses should be unique for a given couple of user and team."""
    access = factories.TeamAccessFactory()

    with pytest.raises(
        ValidationError,
        match="Team/user relation with this User and Team already exists.",
    ):
        factories.TeamAccessFactory(user=access.user, team=access.team)


# get_abilities


def test_models_team_access_get_abilities_anonymous():
    """Check abilities returned for an anonymous user."""
    access = factories.TeamAccessFactory()
    abilities = access.get_abilities(AnonymousUser())
    assert abilities == {
        "delete": False,
        "get": False,
        "patch": False,
        "put": False,
        "set_role_to": [],
    }


def test_models_team_access_get_abilities_authenticated():
    """Check abilities returned for an authenticated user."""
    access = factories.TeamAccessFactory()
    user = factories.UserFactory()
    abilities = access.get_abilities(user)
    assert abilities == {
        "delete": False,
        "get": False,
        "patch": False,
        "put": False,
        "set_role_to": [],
    }


# - for owner


def test_models_team_access_get_abilities_for_owner_of_self_allowed():
    """
    Check abilities of self access for the owner of a team when there is more than one user left.
    """
    access = factories.TeamAccessFactory(role="owner")
    factories.TeamAccessFactory(team=access.team, role="owner")
    abilities = access.get_abilities(access.user)
    assert abilities == {
        "delete": True,
        "get": True,
        "patch": True,
        "put": True,
        "set_role_to": ["administrator", "member"],
    }


def test_models_team_access_get_abilities_for_owner_of_self_last():
    """Check abilities of self access for the owner of a team when there is only one owner left."""
    access = factories.TeamAccessFactory(role="owner")
    abilities = access.get_abilities(access.user)
    assert abilities == {
        "delete": False,
        "get": True,
        "patch": False,
        "put": False,
        "set_role_to": [],
    }


def test_models_team_access_get_abilities_for_owner_of_owner():
    """Check abilities of owner access for the owner of a team."""
    access = factories.TeamAccessFactory(role="owner")
    factories.TeamAccessFactory(team=access.team)  # another one
    user = factories.TeamAccessFactory(team=access.team, role="owner").user
    abilities = access.get_abilities(user)
    assert abilities == {
        "delete": False,
        "get": True,
        "patch": False,
        "put": False,
        "set_role_to": [],
    }


def test_models_team_access_get_abilities_for_owner_of_administrator():
    """Check abilities of administrator access for the owner of a team."""
    access = factories.TeamAccessFactory(role="administrator")
    factories.TeamAccessFactory(team=access.team)  # another one
    user = factories.TeamAccessFactory(team=access.team, role="owner").user
    abilities = access.get_abilities(user)
    assert abilities == {
        "delete": True,
        "get": True,
        "patch": True,
        "put": True,
        "set_role_to": ["owner", "member"],
    }


def test_models_team_access_get_abilities_for_owner_of_member():
    """Check abilities of member access for the owner of a team."""
    access = factories.TeamAccessFactory(role="member")
    factories.TeamAccessFactory(team=access.team)  # another one
    user = factories.TeamAccessFactory(team=access.team, role="owner").user
    abilities = access.get_abilities(user)
    assert abilities == {
        "delete": True,
        "get": True,
        "patch": True,
        "put": True,
        "set_role_to": ["owner", "administrator"],
    }


# - for administrator


def test_models_team_access_get_abilities_for_administrator_of_owner():
    """Check abilities of owner access for the administrator of a team."""
    access = factories.TeamAccessFactory(role="owner")
    factories.TeamAccessFactory(team=access.team)  # another one
    user = factories.TeamAccessFactory(team=access.team, role="administrator").user
    abilities = access.get_abilities(user)
    assert abilities == {
        "delete": False,
        "get": True,
        "patch": False,
        "put": False,
        "set_role_to": [],
    }


def test_models_team_access_get_abilities_for_administrator_of_administrator():
    """Check abilities of administrator access for the administrator of a team."""
    access = factories.TeamAccessFactory(role="administrator")
    factories.TeamAccessFactory(team=access.team)  # another one
    user = factories.TeamAccessFactory(team=access.team, role="administrator").user
    abilities = access.get_abilities(user)
    assert abilities == {
        "delete": True,
        "get": True,
        "patch": True,
        "put": True,
        "set_role_to": ["member"],
    }


def test_models_team_access_get_abilities_for_administrator_of_member():
    """Check abilities of member access for the administrator of a team."""
    access = factories.TeamAccessFactory(role="member")
    factories.TeamAccessFactory(team=access.team)  # another one
    user = factories.TeamAccessFactory(team=access.team, role="administrator").user
    abilities = access.get_abilities(user)
    assert abilities == {
        "delete": True,
        "get": True,
        "patch": True,
        "put": True,
        "set_role_to": ["administrator"],
    }


# - for member


def test_models_team_access_get_abilities_for_member_of_owner():
    """Check abilities of owner access for the member of a team."""
    access = factories.TeamAccessFactory(role="owner")
    factories.TeamAccessFactory(team=access.team)  # another one
    user = factories.TeamAccessFactory(team=access.team, role="member").user
    abilities = access.get_abilities(user)
    assert abilities == {
        "delete": False,
        "get": True,
        "patch": False,
        "put": False,
        "set_role_to": [],
    }


def test_models_team_access_get_abilities_for_member_of_administrator():
    """Check abilities of administrator access for the member of a team."""
    access = factories.TeamAccessFactory(role="administrator")
    factories.TeamAccessFactory(team=access.team)  # another one
    user = factories.TeamAccessFactory(team=access.team, role="member").user
    abilities = access.get_abilities(user)
    assert abilities == {
        "delete": False,
        "get": True,
        "patch": False,
        "put": False,
        "set_role_to": [],
    }


def test_models_team_access_get_abilities_for_member_of_member_user(
    django_assert_num_queries
):
    """Check abilities of member access for the member of a team."""
    access = factories.TeamAccessFactory(role="member")
    factories.TeamAccessFactory(team=access.team)  # another one
    user = factories.TeamAccessFactory(team=access.team, role="member").user

    with django_assert_num_queries(1):
        abilities = access.get_abilities(user)

    assert abilities == {
        "delete": False,
        "get": True,
        "patch": False,
        "put": False,
        "set_role_to": [],
    }


def test_models_team_access_get_abilities_preset_role(django_assert_num_queries):
    """No query is done if the role is preset, e.g., with a query annotation."""
    access = factories.TeamAccessFactory(role="member")
    user = factories.TeamAccessFactory(team=access.team, role="member").user
    access.user_role = "member"

    with django_assert_num_queries(0):
        abilities = access.get_abilities(user)

    assert abilities == {
        "delete": False,
        "get": True,
        "patch": False,
        "put": False,
        "set_role_to": [],
    }
