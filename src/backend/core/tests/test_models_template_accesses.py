"""
Unit tests for the TemplateAccess model
"""
from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ValidationError

import pytest

from core import factories

pytestmark = pytest.mark.django_db


def test_models_template_accesses_str():
    """
    The str representation should include user email, template title and role.
    """
    user = factories.UserFactory(email="david.bowman@example.com")
    access = factories.UserTemplateAccessFactory(
        role="member",
        user=user,
        template__title="admins",
    )
    assert str(access) == "david.bowman@example.com is member in template admins"


def test_models_template_accesses_unique_user():
    """Template accesses should be unique for a given couple of user and template."""
    access = factories.UserTemplateAccessFactory()

    with pytest.raises(
        ValidationError,
        match="This user is already in this template.",
    ):
        factories.UserTemplateAccessFactory(user=access.user, template=access.template)


def test_models_template_accesses_several_empty_teams():
    """A template can have several template accesses with an empty team."""
    access = factories.UserTemplateAccessFactory()
    factories.UserTemplateAccessFactory(template=access.template)


def test_models_template_accesses_unique_team():
    """Template accesses should be unique for a given couple of team and template."""
    access = factories.TeamTemplateAccessFactory()

    with pytest.raises(
        ValidationError,
        match="This team is already in this template.",
    ):
        factories.TeamTemplateAccessFactory(team=access.team, template=access.template)


def test_models_template_accesses_several_null_users():
    """A template can have several template accesses with a null user."""
    access = factories.TeamTemplateAccessFactory()
    factories.TeamTemplateAccessFactory(template=access.template)


def test_models_template_accesses_user_and_team_set():
    """User and team can't both be set on a template access."""
    with pytest.raises(
        ValidationError,
        match="Either user or team must be set, not both.",
    ):
        factories.UserTemplateAccessFactory(team="my-team")


def test_models_template_accesses_user_and_team_empty():
    """User and team can't both be empty on a template access."""
    with pytest.raises(
        ValidationError,
        match="Either user or team must be set, not both.",
    ):
        factories.UserTemplateAccessFactory(user=None)


# get_abilities


def test_models_template_access_get_abilities_anonymous():
    """Check abilities returned for an anonymous user."""
    access = factories.UserTemplateAccessFactory()
    abilities = access.get_abilities(AnonymousUser())
    assert abilities == {
        "destroy": False,
        "retrieve": False,
        "update": False,
        "set_role_to": [],
    }


def test_models_template_access_get_abilities_authenticated():
    """Check abilities returned for an authenticated user."""
    access = factories.UserTemplateAccessFactory()
    user = factories.UserFactory()
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": False,
        "retrieve": False,
        "update": False,
        "set_role_to": [],
    }


# - for owner


def test_models_template_access_get_abilities_for_owner_of_self_allowed():
    """
    Check abilities of self access for the owner of a template when
    there is more than one owner left.
    """
    access = factories.UserTemplateAccessFactory(role="owner")
    factories.UserTemplateAccessFactory(template=access.template, role="owner")
    abilities = access.get_abilities(access.user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "set_role_to": ["administrator", "member"],
    }


def test_models_template_access_get_abilities_for_owner_of_self_last():
    """
    Check abilities of self access for the owner of a template when there is only one owner left.
    """
    access = factories.UserTemplateAccessFactory(role="owner")
    abilities = access.get_abilities(access.user)
    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "set_role_to": [],
    }


def test_models_template_access_get_abilities_for_owner_of_owner():
    """Check abilities of owner access for the owner of a template."""
    access = factories.UserTemplateAccessFactory(role="owner")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="owner"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "set_role_to": ["administrator", "member"],
    }


def test_models_template_access_get_abilities_for_owner_of_administrator():
    """Check abilities of administrator access for the owner of a template."""
    access = factories.UserTemplateAccessFactory(role="administrator")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="owner"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "set_role_to": ["owner", "member"],
    }


def test_models_template_access_get_abilities_for_owner_of_member():
    """Check abilities of member access for the owner of a template."""
    access = factories.UserTemplateAccessFactory(role="member")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="owner"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "set_role_to": ["owner", "administrator"],
    }


# - for administrator


def test_models_template_access_get_abilities_for_administrator_of_owner():
    """Check abilities of owner access for the administrator of a template."""
    access = factories.UserTemplateAccessFactory(role="owner")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="administrator"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "set_role_to": [],
    }


def test_models_template_access_get_abilities_for_administrator_of_administrator():
    """Check abilities of administrator access for the administrator of a template."""
    access = factories.UserTemplateAccessFactory(role="administrator")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="administrator"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "set_role_to": ["member"],
    }


def test_models_template_access_get_abilities_for_administrator_of_member():
    """Check abilities of member access for the administrator of a template."""
    access = factories.UserTemplateAccessFactory(role="member")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="administrator"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "set_role_to": ["administrator"],
    }


# - for member


def test_models_template_access_get_abilities_for_member_of_owner():
    """Check abilities of owner access for the member of a template."""
    access = factories.UserTemplateAccessFactory(role="owner")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="member"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "set_role_to": [],
    }


def test_models_template_access_get_abilities_for_member_of_administrator():
    """Check abilities of administrator access for the member of a template."""
    access = factories.UserTemplateAccessFactory(role="administrator")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="member"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "set_role_to": [],
    }


def test_models_template_access_get_abilities_for_member_of_member_user(
    django_assert_num_queries
):
    """Check abilities of member access for the member of a template."""
    access = factories.UserTemplateAccessFactory(role="member")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="member"
    ).user

    with django_assert_num_queries(1):
        abilities = access.get_abilities(user)

    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "set_role_to": [],
    }


def test_models_template_access_get_abilities_preset_role(django_assert_num_queries):
    """No query is done if the role is preset, e.g., with a query annotation."""
    access = factories.UserTemplateAccessFactory(role="member")
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="member"
    ).user
    access.user_roles = ["member"]

    with django_assert_num_queries(0):
        abilities = access.get_abilities(user)

    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "set_role_to": [],
    }
