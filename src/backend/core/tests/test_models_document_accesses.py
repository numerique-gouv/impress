"""
Unit tests for the DocumentAccess model
"""
from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ValidationError

import pytest

from core import factories

pytestmark = pytest.mark.django_db


def test_models_document_accesses_str():
    """
    The str representation should include user email, document title and role.
    """
    user = factories.UserFactory(email="david.bowman@example.com")
    access = factories.UserDocumentAccessFactory(
        role="member",
        user=user,
        document__title="admins",
    )
    assert str(access) == "david.bowman@example.com is member in document admins"


def test_models_document_accesses_unique_user():
    """Document accesses should be unique for a given couple of user and document."""
    access = factories.UserDocumentAccessFactory()

    with pytest.raises(
        ValidationError,
        match="This user is already in this document.",
    ):
        factories.UserDocumentAccessFactory(user=access.user, document=access.document)


def test_models_document_accesses_several_empty_teams():
    """A document can have several document accesses with an empty team."""
    access = factories.UserDocumentAccessFactory()
    factories.UserDocumentAccessFactory(document=access.document)


def test_models_document_accesses_unique_team():
    """Document accesses should be unique for a given couple of team and document."""
    access = factories.TeamDocumentAccessFactory()

    with pytest.raises(
        ValidationError,
        match="This team is already in this document.",
    ):
        factories.TeamDocumentAccessFactory(team=access.team, document=access.document)


def test_models_document_accesses_several_null_users():
    """A document can have several document accesses with a null user."""
    access = factories.TeamDocumentAccessFactory()
    factories.TeamDocumentAccessFactory(document=access.document)


def test_models_document_accesses_user_and_team_set():
    """User and team can't both be set on a document access."""
    with pytest.raises(
        ValidationError,
        match="Either user or team must be set, not both.",
    ):
        factories.UserDocumentAccessFactory(team="my-team")


def test_models_document_accesses_user_and_team_empty():
    """User and team can't both be empty on a document access."""
    with pytest.raises(
        ValidationError,
        match="Either user or team must be set, not both.",
    ):
        factories.UserDocumentAccessFactory(user=None)


# get_abilities


def test_models_document_access_get_abilities_anonymous():
    """Check abilities returned for an anonymous user."""
    access = factories.UserDocumentAccessFactory()
    abilities = access.get_abilities(AnonymousUser())
    assert abilities == {
        "destroy": False,
        "retrieve": False,
        "update": False,
        "set_role_to": [],
    }


def test_models_document_access_get_abilities_authenticated():
    """Check abilities returned for an authenticated user."""
    access = factories.UserDocumentAccessFactory()
    user = factories.UserFactory()
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": False,
        "retrieve": False,
        "update": False,
        "set_role_to": [],
    }


# - for owner


def test_models_document_access_get_abilities_for_owner_of_self_allowed():
    """
    Check abilities of self access for the owner of a document when
    there is more than one owner left.
    """
    access = factories.UserDocumentAccessFactory(role="owner")
    factories.UserDocumentAccessFactory(document=access.document, role="owner")
    abilities = access.get_abilities(access.user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "set_role_to": ["administrator", "member"],
    }


def test_models_document_access_get_abilities_for_owner_of_self_last():
    """
    Check abilities of self access for the owner of a document when there is only one owner left.
    """
    access = factories.UserDocumentAccessFactory(role="owner")
    abilities = access.get_abilities(access.user)
    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "set_role_to": [],
    }


def test_models_document_access_get_abilities_for_owner_of_owner():
    """Check abilities of owner access for the owner of a document."""
    access = factories.UserDocumentAccessFactory(role="owner")
    factories.UserDocumentAccessFactory(document=access.document)  # another one
    user = factories.UserDocumentAccessFactory(
        document=access.document, role="owner"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "set_role_to": ["administrator", "member"],
    }


def test_models_document_access_get_abilities_for_owner_of_administrator():
    """Check abilities of administrator access for the owner of a document."""
    access = factories.UserDocumentAccessFactory(role="administrator")
    factories.UserDocumentAccessFactory(document=access.document)  # another one
    user = factories.UserDocumentAccessFactory(
        document=access.document, role="owner"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "set_role_to": ["owner", "member"],
    }


def test_models_document_access_get_abilities_for_owner_of_member():
    """Check abilities of member access for the owner of a document."""
    access = factories.UserDocumentAccessFactory(role="member")
    factories.UserDocumentAccessFactory(document=access.document)  # another one
    user = factories.UserDocumentAccessFactory(
        document=access.document, role="owner"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "set_role_to": ["owner", "administrator"],
    }


# - for administrator


def test_models_document_access_get_abilities_for_administrator_of_owner():
    """Check abilities of owner access for the administrator of a document."""
    access = factories.UserDocumentAccessFactory(role="owner")
    factories.UserDocumentAccessFactory(document=access.document)  # another one
    user = factories.UserDocumentAccessFactory(
        document=access.document, role="administrator"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "set_role_to": [],
    }


def test_models_document_access_get_abilities_for_administrator_of_administrator():
    """Check abilities of administrator access for the administrator of a document."""
    access = factories.UserDocumentAccessFactory(role="administrator")
    factories.UserDocumentAccessFactory(document=access.document)  # another one
    user = factories.UserDocumentAccessFactory(
        document=access.document, role="administrator"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "set_role_to": ["member"],
    }


def test_models_document_access_get_abilities_for_administrator_of_member():
    """Check abilities of member access for the administrator of a document."""
    access = factories.UserDocumentAccessFactory(role="member")
    factories.UserDocumentAccessFactory(document=access.document)  # another one
    user = factories.UserDocumentAccessFactory(
        document=access.document, role="administrator"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "set_role_to": ["administrator"],
    }


# - for member


def test_models_document_access_get_abilities_for_member_of_owner():
    """Check abilities of owner access for the member of a document."""
    access = factories.UserDocumentAccessFactory(role="owner")
    factories.UserDocumentAccessFactory(document=access.document)  # another one
    user = factories.UserDocumentAccessFactory(
        document=access.document, role="member"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "set_role_to": [],
    }


def test_models_document_access_get_abilities_for_member_of_administrator():
    """Check abilities of administrator access for the member of a document."""
    access = factories.UserDocumentAccessFactory(role="administrator")
    factories.UserDocumentAccessFactory(document=access.document)  # another one
    user = factories.UserDocumentAccessFactory(
        document=access.document, role="member"
    ).user
    abilities = access.get_abilities(user)
    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "set_role_to": [],
    }


def test_models_document_access_get_abilities_for_member_of_member_user(
    django_assert_num_queries
):
    """Check abilities of member access for the member of a document."""
    access = factories.UserDocumentAccessFactory(role="member")
    factories.UserDocumentAccessFactory(document=access.document)  # another one
    user = factories.UserDocumentAccessFactory(
        document=access.document, role="member"
    ).user

    with django_assert_num_queries(1):
        abilities = access.get_abilities(user)

    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "set_role_to": [],
    }


def test_models_document_access_get_abilities_preset_role(django_assert_num_queries):
    """No query is done if the role is preset, e.g., with a query annotation."""
    access = factories.UserDocumentAccessFactory(role="member")
    user = factories.UserDocumentAccessFactory(
        document=access.document, role="member"
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
