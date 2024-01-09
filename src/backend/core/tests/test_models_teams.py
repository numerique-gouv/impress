"""
Unit tests for the Team model
"""
from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ValidationError

import pytest

from core import factories, models

pytestmark = pytest.mark.django_db


def test_models_teams_str():
    """The str representation should be the name of the team."""
    team = factories.TeamFactory(name="admins")
    assert str(team) == "admins"


def test_models_teams_id_unique():
    """The "id" field should be unique."""
    team = factories.TeamFactory()
    with pytest.raises(ValidationError, match="Team with this Id already exists."):
        factories.TeamFactory(id=team.id)


def test_models_teams_name_null():
    """The "name" field should not be null."""
    with pytest.raises(ValidationError, match="This field cannot be null."):
        models.Team.objects.create(name=None)


def test_models_teams_name_empty():
    """The "name" field should not be empty."""
    with pytest.raises(ValidationError, match="This field cannot be blank."):
        models.Team.objects.create(name="")


def test_models_teams_name_max_length():
    """The "name" field should be 100 characters maximum."""
    factories.TeamFactory(name="a " * 50)
    with pytest.raises(
        ValidationError,
        match=r"Ensure this value has at most 100 characters \(it has 102\)\.",
    ):
        factories.TeamFactory(name="a " * 51)


# get_abilities


def test_models_teams_get_abilities_anonymous():
    """Check abilities returned for an anonymous user."""
    team = factories.TeamFactory()
    abilities = team.get_abilities(AnonymousUser())
    assert abilities == {
        "delete": False,
        "get": True,
        "patch": False,
        "put": False,
        "manage_accesses": False,
    }


def test_models_teams_get_abilities_authenticated():
    """Check abilities returned for an authenticated user."""
    team = factories.TeamFactory()
    abilities = team.get_abilities(factories.UserFactory())
    assert abilities == {
        "delete": False,
        "get": True,
        "patch": False,
        "put": False,
        "manage_accesses": False,
    }


def test_models_teams_get_abilities_owner():
    """Check abilities returned for the owner of a team."""
    user = factories.UserFactory()
    access = factories.TeamAccessFactory(role="owner", user=user)
    abilities = access.team.get_abilities(access.user)
    assert abilities == {
        "delete": True,
        "get": True,
        "patch": True,
        "put": True,
        "manage_accesses": True,
    }


def test_models_teams_get_abilities_administrator():
    """Check abilities returned for the administrator of a team."""
    access = factories.TeamAccessFactory(role="administrator")
    abilities = access.team.get_abilities(access.user)
    assert abilities == {
        "delete": False,
        "get": True,
        "patch": True,
        "put": True,
        "manage_accesses": True,
    }


def test_models_teams_get_abilities_member_user(django_assert_num_queries):
    """Check abilities returned for the member of a team."""
    access = factories.TeamAccessFactory(role="member")

    with django_assert_num_queries(1):
        abilities = access.team.get_abilities(access.user)

    assert abilities == {
        "delete": False,
        "get": True,
        "patch": False,
        "put": False,
        "manage_accesses": False,
    }


def test_models_teams_get_abilities_preset_role(django_assert_num_queries):
    """No query is done if the role is preset e.g. with query annotation."""
    access = factories.TeamAccessFactory(role="member")
    access.team.user_role = "member"

    with django_assert_num_queries(0):
        abilities = access.team.get_abilities(access.user)

    assert abilities == {
        "delete": False,
        "get": True,
        "patch": False,
        "put": False,
        "manage_accesses": False,
    }
