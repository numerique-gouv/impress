"""
Unit tests for the Document model
"""
from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage

import pytest

from core import factories, models

pytestmark = pytest.mark.django_db


def test_models_documents_str():
    """The str representation should be the title of the document."""
    document = factories.DocumentFactory(title="admins")
    assert str(document) == "admins"


def test_models_documents_id_unique():
    """The "id" field should be unique."""
    document = factories.DocumentFactory()
    with pytest.raises(ValidationError, match="Document with this Id already exists."):
        factories.DocumentFactory(id=document.id)


def test_models_documents_title_null():
    """The "title" field should not be null."""
    with pytest.raises(ValidationError, match="This field cannot be null."):
        models.Document.objects.create(title=None)


def test_models_documents_title_empty():
    """The "title" field should not be empty."""
    with pytest.raises(ValidationError, match="This field cannot be blank."):
        models.Document.objects.create(title="")


def test_models_documents_title_max_length():
    """The "title" field should be 100 characters maximum."""
    factories.DocumentFactory(title="a" * 255)
    with pytest.raises(
        ValidationError,
        match=r"Ensure this value has at most 255 characters \(it has 256\)\.",
    ):
        factories.DocumentFactory(title="a" * 256)


# get_abilities


def test_models_documents_get_abilities_anonymous_public():
    """Check abilities returned for an anonymous user if the document is public."""
    document = factories.DocumentFactory(is_public=True)
    abilities = document.get_abilities(AnonymousUser())
    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "manage_accesses": False,
        "partial_update": False,
        "versions_destroy": False,
        "versions_list": False,
        "versions_retrieve": False,
    }


def test_models_documents_get_abilities_anonymous_not_public():
    """Check abilities returned for an anonymous user if the document is private."""
    document = factories.DocumentFactory(is_public=False)
    abilities = document.get_abilities(AnonymousUser())
    assert abilities == {
        "destroy": False,
        "retrieve": False,
        "update": False,
        "manage_accesses": False,
        "partial_update": False,
        "versions_destroy": False,
        "versions_list": False,
        "versions_retrieve": False,
    }


def test_models_documents_get_abilities_authenticated_unrelated_public():
    """Check abilities returned for an authenticated user if the user is public."""
    document = factories.DocumentFactory(is_public=True)
    abilities = document.get_abilities(factories.UserFactory())
    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "manage_accesses": False,
        "partial_update": False,
        "versions_destroy": False,
        "versions_list": False,
        "versions_retrieve": False,
    }


def test_models_documents_get_abilities_authenticated_unrelated_not_public():
    """Check abilities returned for an authenticated user if the document is private."""
    document = factories.DocumentFactory(is_public=False)
    abilities = document.get_abilities(factories.UserFactory())
    assert abilities == {
        "destroy": False,
        "retrieve": False,
        "update": False,
        "manage_accesses": False,
        "partial_update": False,
        "versions_destroy": False,
        "versions_list": False,
        "versions_retrieve": False,
    }


def test_models_documents_get_abilities_owner():
    """Check abilities returned for the owner of a document."""
    user = factories.UserFactory()
    access = factories.UserDocumentAccessFactory(role="owner", user=user)
    abilities = access.document.get_abilities(access.user)
    assert abilities == {
        "destroy": True,
        "retrieve": True,
        "update": True,
        "manage_accesses": True,
        "partial_update": True,
        "versions_destroy": True,
        "versions_list": True,
        "versions_retrieve": True,
    }


def test_models_documents_get_abilities_administrator():
    """Check abilities returned for the administrator of a document."""
    access = factories.UserDocumentAccessFactory(role="administrator")
    abilities = access.document.get_abilities(access.user)
    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": True,
        "manage_accesses": True,
        "partial_update": True,
        "versions_destroy": True,
        "versions_list": True,
        "versions_retrieve": True,
    }


def test_models_documents_get_abilities_member_user(django_assert_num_queries):
    """Check abilities returned for the member of a document."""
    access = factories.UserDocumentAccessFactory(role="member")

    with django_assert_num_queries(1):
        abilities = access.document.get_abilities(access.user)

    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "manage_accesses": False,
        "partial_update": False,
        "versions_destroy": False,
        "versions_list": True,
        "versions_retrieve": True,
    }


def test_models_documents_get_abilities_preset_role(django_assert_num_queries):
    """No query is done if the role is preset e.g. with query annotation."""
    access = factories.UserDocumentAccessFactory(role="member")
    access.document.user_roles = ["member"]

    with django_assert_num_queries(0):
        abilities = access.document.get_abilities(access.user)

    assert abilities == {
        "destroy": False,
        "retrieve": True,
        "update": False,
        "manage_accesses": False,
        "partial_update": False,
        "versions_destroy": False,
        "versions_list": True,
        "versions_retrieve": True,
    }


def test_models_documents_get_versions_slice(settings):
    """
    The "get_versions_slice" method should allow navigating all versions of
    the document with pagination.
    """
    settings.S3_VERSIONS_PAGE_SIZE = 4

    # Create a document with 7 versions
    document = factories.DocumentFactory()
    for i in range(6):
        document.content = {"foo": f"bar{i:d}"}
        document.save()

    # Add a version not related to the first document
    factories.DocumentFactory()

    # - Get default max versions
    response = document.get_versions_slice()
    assert response["is_truncated"] is True
    assert len(response["versions"]) == 4
    assert response["next_version_id_marker"] != ""

    expected_keys = ["etag", "is_latest", "last_modified", "version_id"]
    for i in range(4):
        assert list(response["versions"][i].keys()) == expected_keys

    # - Get page 2
    response = document.get_versions_slice(
        from_version_id=response["next_version_id_marker"]
    )
    assert response["is_truncated"] is False
    assert len(response["versions"]) == 3
    assert response["next_version_id_marker"] == ""

    # - Get custom max versions
    response = document.get_versions_slice(page_size=2)
    assert response["is_truncated"] is True
    assert len(response["versions"]) == 2
    assert response["next_version_id_marker"] != ""


def test_models_documents_version_duplicate():
    """A new version should be created in object storage only if the content has changed."""
    document = factories.DocumentFactory()

    file_key = str(document.pk)
    response = default_storage.connection.meta.client.list_object_versions(
        Bucket=default_storage.bucket_name, Prefix=file_key
    )
    assert len(response["Versions"]) == 1

    # Save again with the same content
    document.save()

    response = default_storage.connection.meta.client.list_object_versions(
        Bucket=default_storage.bucket_name, Prefix=file_key
    )
    assert len(response["Versions"]) == 1

    # Save modified content
    document.content = {"foo": "spam"}
    document.save()

    response = default_storage.connection.meta.client.list_object_versions(
        Bucket=default_storage.bucket_name, Prefix=file_key
    )
    assert len(response["Versions"]) == 2
