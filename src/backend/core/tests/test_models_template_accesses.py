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
        role="reader",
        user=user,
        template__title="admins",
    )
    assert str(access) == "david.bowman@example.com is reader in template admins"


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
        "partial_update": False,
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
        "partial_update": False,
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
        "partial_update": True,
        "set_role_to": ["administrator", "editor", "reader"],
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
        "partial_update": False,
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
        "partial_update": True,
        "set_role_to": ["administrator", "editor", "reader"],
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
        "partial_update": True,
        "set_role_to": ["owner", "editor", "reader"],
    }


def test_models_template_access_get_abilities_for_owner_of_editor():
    """Check abilities of editor access for the owner of a template."""
    access = factories.UserTemplateAccessFactory(role="editor")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="owner"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "partial_update": True,
        "set_role_to": ["owner", "administrator", "reader"],
    }


def test_models_template_access_get_abilities_for_owner_of_reader():
    """Check abilities of reader access for the owner of a template."""
    access = factories.UserTemplateAccessFactory(role="reader")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="owner"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "partial_update": True,
        "set_role_to": ["owner", "administrator", "editor"],
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
        "partial_update": False,
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
        "partial_update": True,
        "set_role_to": ["editor", "reader"],
    }


def test_models_template_access_get_abilities_for_administrator_of_editor():
    """Check abilities of editor access for the administrator of a template."""
    access = factories.UserTemplateAccessFactory(role="editor")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="administrator"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "partial_update": True,
        "set_role_to": ["administrator", "reader"],
    }


def test_models_template_access_get_abilities_for_administrator_of_reader():
    """Check abilities of reader access for the administrator of a template."""
    access = factories.UserTemplateAccessFactory(role="reader")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="administrator"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "partial_update": True,
        "set_role_to": ["administrator", "editor"],
    }


# - For editor


def test_models_template_access_get_abilities_for_editor_of_owner():
    """Check abilities of owner access for the editor of a template."""
    access = factories.UserTemplateAccessFactory(role="owner")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="editor"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "partial_update": False,
        "set_role_to": [],
    }


def test_models_template_access_get_abilities_for_editor_of_administrator():
    """Check abilities of administrator access for the editor of a template."""
    access = factories.UserTemplateAccessFactory(role="administrator")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="editor"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "partial_update": False,
        "set_role_to": [],
    }


def test_models_template_access_get_abilities_for_editor_of_editor_user(
    django_assert_num_queries,
):
    """Check abilities of editor access for the editor of a template."""
    access = factories.UserTemplateAccessFactory(role="editor")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="editor"
    ).user

    with django_assert_num_queries(1):
        abilities = access.get_abilities(user)

    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "partial_update": False,
        "set_role_to": [],
    }


# - For reader


def test_models_template_access_get_abilities_for_reader_of_owner():
    """Check abilities of owner access for the reader of a template."""
    access = factories.UserTemplateAccessFactory(role="owner")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="reader"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "partial_update": False,
        "set_role_to": [],
    }


def test_models_template_access_get_abilities_for_reader_of_administrator():
    """Check abilities of administrator access for the reader of a template."""
    access = factories.UserTemplateAccessFactory(role="administrator")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="reader"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "partial_update": False,
        "set_role_to": [],
    }


def test_models_template_access_get_abilities_for_reader_of_reader_user(
    django_assert_num_queries,
):
    """Check abilities of reader access for the reader of a template."""
    access = factories.UserTemplateAccessFactory(role="reader")
    factories.UserTemplateAccessFactory(template=access.template)  # another one
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="reader"
    ).user

    with django_assert_num_queries(1):
        abilities = access.get_abilities(user)

    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "partial_update": False,
        "set_role_to": [],
    }


def test_models_template_access_get_abilities_preset_role(django_assert_num_queries):
    """No query is done if the role is preset, e.g., with a query annotation."""
    access = factories.UserTemplateAccessFactory(role="reader")
    user = factories.UserTemplateAccessFactory(
        template=access.template, role="reader"
    ).user
    access.user_roles = ["reader"]

    with django_assert_num_queries(0):
        abilities = access.get_abilities(user)

    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "partial_update": False,
        "set_role_to": [],
    }
