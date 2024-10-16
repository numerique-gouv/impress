"""
Unit tests for the Document model
"""

import smtplib
from logging import Logger
from unittest import mock

from django.contrib.auth.models import AnonymousUser
from django.core import mail
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from django.utils import timezone

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
    """The "title" field can be null."""
    document = models.Document.objects.create(title=None)
    assert document.title is None


def test_models_documents_title_empty():
    """The "title" field can be empty."""
    document = models.Document.objects.create(title="")
    assert document.title == ""


def test_models_documents_title_max_length():
    """The "title" field should be 100 characters maximum."""
    factories.DocumentFactory(title="a" * 255)
    with pytest.raises(
        ValidationError,
        match=r"Ensure this value has at most 255 characters \(it has 256\)\.",
    ):
        factories.DocumentFactory(title="a" * 256)


def test_models_documents_file_key():
    """The file key should be built from the instance uuid."""
    document = factories.DocumentFactory(id="9531a5f1-42b1-496c-b3f4-1c09ed139b3c")
    assert document.file_key == "9531a5f1-42b1-496c-b3f4-1c09ed139b3c/file"


# get_abilities


@pytest.mark.parametrize(
    "is_authenticated,reach,role",
    [
        (True, "restricted", "reader"),
        (True, "restricted", "editor"),
        (False, "restricted", "reader"),
        (False, "restricted", "editor"),
        (False, "authenticated", "reader"),
        (False, "authenticated", "editor"),
    ],
)
def test_models_documents_get_abilities_forbidden(is_authenticated, reach, role):
    """
    Check abilities returned for a document giving insufficient roles to link holders
    i.e anonymous users or authenticated users who have no specific role on the document.
    """
    document = factories.DocumentFactory(link_reach=reach, link_role=role)
    user = factories.UserFactory() if is_authenticated else AnonymousUser()
    abilities = document.get_abilities(user)
    assert abilities == {
        "ai_transform": False,
        "ai_translate": False,
        "attachment_upload": False,
        "link_configuration": False,
        "destroy": False,
        "manage_accesses": False,
        "partial_update": False,
        "retrieve": False,
        "update": False,
        "versions_destroy": False,
        "versions_list": False,
        "versions_retrieve": False,
    }


@pytest.mark.parametrize(
    "is_authenticated,reach",
    [
        (True, "public"),
        (False, "public"),
        (True, "authenticated"),
    ],
)
def test_models_documents_get_abilities_reader(is_authenticated, reach):
    """
    Check abilities returned for a document giving reader role to link holders
    i.e anonymous users or authenticated users who have no specific role on the document.
    """
    document = factories.DocumentFactory(link_reach=reach, link_role="reader")
    user = factories.UserFactory() if is_authenticated else AnonymousUser()
    abilities = document.get_abilities(user)
    assert abilities == {
        "ai_transform": False,
        "ai_translate": False,
        "attachment_upload": False,
        "destroy": False,
        "link_configuration": False,
        "manage_accesses": False,
        "partial_update": False,
        "retrieve": True,
        "update": False,
        "versions_destroy": False,
        "versions_list": False,
        "versions_retrieve": False,
    }


@pytest.mark.parametrize(
    "is_authenticated,reach",
    [
        (True, "public"),
        (False, "public"),
        (True, "authenticated"),
    ],
)
def test_models_documents_get_abilities_editor(is_authenticated, reach):
    """
    Check abilities returned for a document giving editor role to link holders
    i.e anonymous users or authenticated users who have no specific role on the document.
    """
    document = factories.DocumentFactory(link_reach=reach, link_role="editor")
    user = factories.UserFactory() if is_authenticated else AnonymousUser()
    abilities = document.get_abilities(user)
    assert abilities == {
        "ai_transform": True,
        "ai_translate": True,
        "attachment_upload": True,
        "destroy": False,
        "link_configuration": False,
        "manage_accesses": False,
        "partial_update": True,
        "retrieve": True,
        "update": True,
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
        "ai_transform": True,
        "ai_translate": True,
        "attachment_upload": True,
        "destroy": True,
        "link_configuration": True,
        "manage_accesses": True,
        "partial_update": True,
        "retrieve": True,
        "update": True,
        "versions_destroy": True,
        "versions_list": True,
        "versions_retrieve": True,
    }


def test_models_documents_get_abilities_administrator():
    """Check abilities returned for the administrator of a document."""
    access = factories.UserDocumentAccessFactory(role="administrator")
    abilities = access.document.get_abilities(access.user)
    assert abilities == {
        "ai_transform": True,
        "ai_translate": True,
        "attachment_upload": True,
        "destroy": False,
        "link_configuration": True,
        "manage_accesses": True,
        "partial_update": True,
        "retrieve": True,
        "update": True,
        "versions_destroy": True,
        "versions_list": True,
        "versions_retrieve": True,
    }


def test_models_documents_get_abilities_editor_user(django_assert_num_queries):
    """Check abilities returned for the editor of a document."""
    access = factories.UserDocumentAccessFactory(role="editor")

    with django_assert_num_queries(1):
        abilities = access.document.get_abilities(access.user)

    assert abilities == {
        "ai_transform": True,
        "ai_translate": True,
        "attachment_upload": True,
        "destroy": False,
        "link_configuration": False,
        "manage_accesses": False,
        "partial_update": True,
        "retrieve": True,
        "update": True,
        "versions_destroy": False,
        "versions_list": True,
        "versions_retrieve": True,
    }


def test_models_documents_get_abilities_reader_user(django_assert_num_queries):
    """Check abilities returned for the reader of a document."""
    access = factories.UserDocumentAccessFactory(
        role="reader", document__link_role="reader"
    )

    with django_assert_num_queries(1):
        abilities = access.document.get_abilities(access.user)

    assert abilities == {
        "ai_transform": False,
        "ai_translate": False,
        "attachment_upload": False,
        "destroy": False,
        "link_configuration": False,
        "manage_accesses": False,
        "partial_update": False,
        "retrieve": True,
        "update": False,
        "versions_destroy": False,
        "versions_list": True,
        "versions_retrieve": True,
    }


def test_models_documents_get_abilities_preset_role(django_assert_num_queries):
    """No query is done if the role is preset e.g. with query annotation."""
    access = factories.UserDocumentAccessFactory(
        role="reader", document__link_role="reader"
    )
    access.document.user_roles = ["reader"]

    with django_assert_num_queries(0):
        abilities = access.document.get_abilities(access.user)

    assert abilities == {
        "ai_transform": False,
        "ai_translate": False,
        "attachment_upload": False,
        "destroy": False,
        "link_configuration": False,
        "manage_accesses": False,
        "partial_update": False,
        "retrieve": True,
        "update": False,
        "versions_destroy": False,
        "versions_list": True,
        "versions_retrieve": True,
    }


def test_models_documents_get_versions_slice_pagination(settings):
    """
    The "get_versions_slice" method should allow navigating all versions of
    the document with pagination.
    """
    settings.DOCUMENT_VERSIONS_PAGE_SIZE = 4

    # Create a document with 7 versions
    document = factories.DocumentFactory()
    for i in range(6):
        document.content = f"bar{i:d}"
        document.save()

    # Add a document version not related to the first document
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
    assert len(response["versions"]) == 2
    assert response["next_version_id_marker"] == ""

    # - Get custom max versions
    response = document.get_versions_slice(page_size=2)
    assert response["is_truncated"] is True
    assert len(response["versions"]) == 2
    assert response["next_version_id_marker"] != ""


def test_models_documents_get_versions_slice_min_datetime():
    """
    The "get_versions_slice" method should filter out versions anterior to
    the from_datetime passed in argument and the current version.
    """
    document = factories.DocumentFactory()
    from_dt = []
    for i in range(6):
        from_dt.append(timezone.now())
        document.content = f"bar{i:d}"
        document.save()

    response = document.get_versions_slice(min_datetime=from_dt[2])

    assert len(response["versions"]) == 3
    for version in response["versions"]:
        assert version["last_modified"] > from_dt[2]

    response = document.get_versions_slice(min_datetime=from_dt[4])

    assert len(response["versions"]) == 1
    assert response["versions"][0]["last_modified"] > from_dt[4]


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
    document.content = "new content"
    document.save()

    response = default_storage.connection.meta.client.list_object_versions(
        Bucket=default_storage.bucket_name, Prefix=file_key
    )
    assert len(response["Versions"]) == 2


def test_models_documents__email_invitation__success():
    """
    The email invitation is sent successfully.
    """
    document = factories.DocumentFactory()

    # pylint: disable-next=no-member
    assert len(mail.outbox) == 0

    sender = factories.UserFactory(full_name="Test Sender", email="sender@example.com")
    document.email_invitation(
        "en", "guest@example.com", models.RoleChoices.EDITOR, sender
    )

    # pylint: disable-next=no-member
    assert len(mail.outbox) == 1

    # pylint: disable-next=no-member
    email = mail.outbox[0]

    assert email.to == ["guest@example.com"]
    email_content = " ".join(email.body.split())

    assert (
        f'Test Sender (sender@example.com) invited you with the role "editor" '
        f"on the following document : {document.title}" in email_content
    )
    assert f"docs/{document.id}/" in email_content


def test_models_documents__email_invitation__success_fr():
    """
    The email invitation is sent successfully in french.
    """
    document = factories.DocumentFactory()

    # pylint: disable-next=no-member
    assert len(mail.outbox) == 0

    sender = factories.UserFactory(
        full_name="Test Sender2", email="sender2@example.com"
    )
    document.email_invitation(
        "fr-fr",
        "guest2@example.com",
        models.RoleChoices.OWNER,
        sender,
    )

    # pylint: disable-next=no-member
    assert len(mail.outbox) == 1

    # pylint: disable-next=no-member
    email = mail.outbox[0]

    assert email.to == ["guest2@example.com"]
    email_content = " ".join(email.body.split())

    assert (
        f'Test Sender2 (sender2@example.com) vous a invité avec le rôle "propriétaire" '
        f"sur le document suivant : {document.title}" in email_content
    )
    assert f"docs/{document.id}/" in email_content


@mock.patch(
    "core.models.send_mail",
    side_effect=smtplib.SMTPException("Error SMTPException"),
)
@mock.patch.object(Logger, "error")
def test_models_documents__email_invitation__failed(mock_logger, _mock_send_mail):
    """Check mail behavior when an SMTP error occurs when sent an email invitation."""
    document = factories.DocumentFactory()

    # pylint: disable-next=no-member
    assert len(mail.outbox) == 0

    sender = factories.UserFactory()
    document.email_invitation(
        "en",
        "guest3@example.com",
        models.RoleChoices.ADMIN,
        sender,
    )

    # No email has been sent
    # pylint: disable-next=no-member
    assert len(mail.outbox) == 0

    # Logger should be called
    mock_logger.assert_called_once()

    (
        _,
        email,
        exception,
    ) = mock_logger.call_args.args

    assert email == "guest3@example.com"
    assert isinstance(exception, smtplib.SMTPException)
