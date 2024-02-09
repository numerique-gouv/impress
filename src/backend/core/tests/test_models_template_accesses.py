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
    access = factories.TemplateAccessFactory(
        role="member",
        user=user,
        template__title="admins",
    )
    assert str(access) == "david.bowman@example.com is member in template admins"


def test_models_template_accesses_unique():
    """Template accesses should be unique for a given couple of user and template."""
    access = factories.TemplateAccessFactory()

    with pytest.raises(
        ValidationError,
        match="Template/user relation with this User and Template already exists.",
    ):
        factories.TemplateAccessFactory(user=access.user, template=access.template)


# get_abilities


def test_models_template_access_get_abilities_anonymous():
    """Check abilities returned for an anonymous user."""
    access = factories.TemplateAccessFactory()
    abilities = access.get_abilities(AnonymousUser())
    assert abilities == {
        "destroy": False,
        "retrieve": False,
        "update": False,
        "set_role_to": [],
    }


def test_models_template_access_get_abilities_authenticated():
    """Check abilities returned for an authenticated user."""
    access = factories.TemplateAccessFactory()
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
    access = factories.TemplateAccessFactory(role="owner")
    factories.TemplateAccessFactory(template=access.template, role="owner")
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
    access = factories.TemplateAccessFactory(role="owner")
    abilities = access.get_abilities(access.user)
    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "set_role_to": [],
    }


def test_models_template_access_get_abilities_for_owner_of_owner():
    """Check abilities of owner access for the owner of a template."""
    access = factories.TemplateAccessFactory(role="owner")
    factories.TemplateAccessFactory(template=access.template)  # another one
    user = factories.TemplateAccessFactory(template=access.template, role="owner").user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "set_role_to": ["administrator", "member"],
    }


def test_models_template_access_get_abilities_for_owner_of_administrator():
    """Check abilities of administrator access for the owner of a template."""
    access = factories.TemplateAccessFactory(role="administrator")
    factories.TemplateAccessFactory(template=access.template)  # another one
    user = factories.TemplateAccessFactory(template=access.template, role="owner").user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "set_role_to": ["owner", "member"],
    }


def test_models_template_access_get_abilities_for_owner_of_member():
    """Check abilities of member access for the owner of a template."""
    access = factories.TemplateAccessFactory(role="member")
    factories.TemplateAccessFactory(template=access.template)  # another one
    user = factories.TemplateAccessFactory(template=access.template, role="owner").user
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
    access = factories.TemplateAccessFactory(role="owner")
    factories.TemplateAccessFactory(template=access.template)  # another one
    user = factories.TemplateAccessFactory(
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
    access = factories.TemplateAccessFactory(role="administrator")
    factories.TemplateAccessFactory(template=access.template)  # another one
    user = factories.TemplateAccessFactory(
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
    access = factories.TemplateAccessFactory(role="member")
    factories.TemplateAccessFactory(template=access.template)  # another one
    user = factories.TemplateAccessFactory(
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
    access = factories.TemplateAccessFactory(role="owner")
    factories.TemplateAccessFactory(template=access.template)  # another one
    user = factories.TemplateAccessFactory(template=access.template, role="member").user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "set_role_to": [],
    }


def test_models_template_access_get_abilities_for_member_of_administrator():
    """Check abilities of administrator access for the member of a template."""
    access = factories.TemplateAccessFactory(role="administrator")
    factories.TemplateAccessFactory(template=access.template)  # another one
    user = factories.TemplateAccessFactory(template=access.template, role="member").user
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
    access = factories.TemplateAccessFactory(role="member")
    factories.TemplateAccessFactory(template=access.template)  # another one
    user = factories.TemplateAccessFactory(template=access.template, role="member").user

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
    access = factories.TemplateAccessFactory(role="member")
    user = factories.TemplateAccessFactory(template=access.template, role="member").user
    access.user_role = "member"

    with django_assert_num_queries(0):
        abilities = access.get_abilities(user)

    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "set_role_to": [],
    }
