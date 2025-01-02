"""
Test file uploads API endpoint for users in impress's core app.
"""

import re
import uuid

from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile

import pytest
from rest_framework.test import APIClient

from core import factories
from core.tests.conftest import TEAM, USER, VIA

pytestmark = pytest.mark.django_db

PIXEL = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00"
    b"\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\xf8\xff\xff?\x00\x05\xfe\x02\xfe"
    b"\xa7V\xbd\xfa\x00\x00\x00\x00IEND\xaeB`\x82"
)


@pytest.mark.parametrize(
    "reach, role",
    [
        ("restricted", "reader"),
        ("restricted", "editor"),
        ("authenticated", "reader"),
        ("authenticated", "editor"),
        ("public", "reader"),
    ],
)
def test_api_documents_attachment_upload_anonymous_forbidden(reach, role):
    """
    Anonymous users should not be able to upload attachments if the link reach
    and role don't allow it.
    """
    document = factories.DocumentFactory(link_reach=reach, link_role=role)
    file = SimpleUploadedFile(name="test.png", content=PIXEL, content_type="image/png")

    url = f"/api/v1.0/documents/{document.id!s}/attachment-upload/"
    response = APIClient().post(url, {"file": file}, format="multipart")

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }


def test_api_documents_attachment_upload_anonymous_success():
    """
    Anonymous users should be able to upload attachments to a document
    if the link reach and role permit it.
    """
    document = factories.DocumentFactory(link_reach="public", link_role="editor")
    file = SimpleUploadedFile(name="test.png", content=PIXEL, content_type="image/png")

    url = f"/api/v1.0/documents/{document.id!s}/attachment-upload/"
    response = APIClient().post(url, {"file": file}, format="multipart")

    assert response.status_code == 201

    pattern = re.compile(rf"^/media/{document.id!s}/attachments/(.*)\.png")
    match = pattern.search(response.json()["file"])
    file_id = match.group(1)

    # Validate that file_id is a valid UUID
    uuid.UUID(file_id)


@pytest.mark.parametrize(
    "reach, role",
    [
        ("restricted", "reader"),
        ("restricted", "editor"),
        ("authenticated", "reader"),
        ("public", "reader"),
    ],
)
def test_api_documents_attachment_upload_authenticated_forbidden(reach, role):
    """
    Users who are not related to a document can't upload attachments if the
    link reach and role don't allow it.
    """
    user = factories.UserFactory(with_owned_document=True)

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(link_reach=reach, link_role=role)
    file = SimpleUploadedFile(name="test.png", content=PIXEL, content_type="image/png")

    url = f"/api/v1.0/documents/{document.id!s}/attachment-upload/"
    response = client.post(url, {"file": file}, format="multipart")

    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }


@pytest.mark.parametrize(
    "reach, role",
    [
        ("authenticated", "editor"),
        ("public", "editor"),
    ],
)
def test_api_documents_attachment_upload_authenticated_success(reach, role):
    """
    Authenticated who are not related to a document should be able to upload a file
    if the link reach and role permit it.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(link_reach=reach, link_role=role)
    file = SimpleUploadedFile(name="test.png", content=PIXEL, content_type="image/png")

    url = f"/api/v1.0/documents/{document.id!s}/attachment-upload/"
    response = client.post(url, {"file": file}, format="multipart")

    assert response.status_code == 201

    pattern = re.compile(rf"^/media/{document.id!s}/attachments/(.*)\.png")
    match = pattern.search(response.json()["file"])
    file_id = match.group(1)

    # Validate that file_id is a valid UUID
    uuid.UUID(file_id)


@pytest.mark.parametrize("via", VIA)
def test_api_documents_attachment_upload_reader(via, mock_user_teams):
    """
    Users who are simple readers on a document should not be allowed to upload an attachment.
    """
    user = factories.UserFactory(with_owned_document=True)

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(link_role="reader")
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role="reader")
    elif via == TEAM:
        mock_user_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role="reader"
        )

    file = SimpleUploadedFile(name="test.png", content=PIXEL, content_type="image/png")

    url = f"/api/v1.0/documents/{document.id!s}/attachment-upload/"
    response = client.post(url, {"file": file}, format="multipart")

    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }


@pytest.mark.parametrize("role", ["editor", "administrator", "owner"])
@pytest.mark.parametrize("via", VIA)
def test_api_documents_attachment_upload_success(via, role, mock_user_teams):
    """
    Editors, administrators and owners of a document should be able to upload an attachment.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role=role)
    elif via == TEAM:
        mock_user_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role=role
        )

    file = SimpleUploadedFile(name="test.png", content=PIXEL, content_type="image/png")

    url = f"/api/v1.0/documents/{document.id!s}/attachment-upload/"
    response = client.post(url, {"file": file}, format="multipart")

    assert response.status_code == 201

    file_path = response.json()["file"]
    pattern = re.compile(rf"^/media/{document.id!s}/attachments/(.*)\.png")
    match = pattern.search(file_path)
    file_id = match.group(1)

    # Validate that file_id is a valid UUID
    uuid.UUID(file_id)

    # Now, check the metadata of the uploaded file
    key = file_path.replace("/media", "")
    file_head = default_storage.connection.meta.client.head_object(
        Bucket=default_storage.bucket_name, Key=key
    )
    assert file_head["Metadata"] == {"owner": str(user.id)}


def test_api_documents_attachment_upload_invalid(client):
    """Attempt to upload without a file should return an explicit error."""
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(users=[(user, "owner")])
    url = f"/api/v1.0/documents/{document.id!s}/attachment-upload/"

    response = client.post(url, {}, format="multipart")

    assert response.status_code == 400
    assert response.json() == {"file": ["No file was submitted."]}


def test_api_documents_attachment_upload_size_limit_exceeded(settings):
    """The uploaded file should not exceed the maximum size in settings."""
    settings.DOCUMENT_IMAGE_MAX_SIZE = 1048576  # 1 MB for test

    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(users=[(user, "owner")])
    url = f"/api/v1.0/documents/{document.id!s}/attachment-upload/"

    # Create a temporary file larger than the allowed size
    file = SimpleUploadedFile(
        name="test.txt", content=b"a" * (1048576 + 1), content_type="text/plain"
    )

    response = client.post(url, {"file": file}, format="multipart")

    assert response.status_code == 400
    assert response.json() == {"file": ["File size exceeds the maximum limit of 1 MB."]}


@pytest.mark.parametrize(
    "name,content,extension",
    [
        ("test.exe", b"text", "exe"),
        ("test", b"text", "txt"),
        ("test.aaaaaa", b"test", "txt"),
        ("test.txt", PIXEL, "txt"),
        ("test.py", b"#!/usr/bin/python", "py"),
    ],
)
def test_api_documents_attachment_upload_fix_extension(name, content, extension):
    """
    A file with no extension or a wrong extension is accepted and the extension
    is corrected in storage.
    """
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(users=[(user, "owner")])
    url = f"/api/v1.0/documents/{document.id!s}/attachment-upload/"

    file = SimpleUploadedFile(name=name, content=content)
    response = client.post(url, {"file": file}, format="multipart")

    assert response.status_code == 201

    file_path = response.json()["file"]
    pattern = re.compile(rf"^/media/{document.id!s}/attachments/(.*)\.{extension:s}")
    match = pattern.search(file_path)
    file_id = match.group(1)

    # Validate that file_id is a valid UUID
    uuid.UUID(file_id)

    # Now, check the metadata of the uploaded file
    key = file_path.replace("/media", "")
    file_head = default_storage.connection.meta.client.head_object(
        Bucket=default_storage.bucket_name, Key=key
    )
    assert file_head["Metadata"] == {"owner": str(user.id), "is_unsafe": "true"}


def test_api_documents_attachment_upload_empty_file():
    """An empty file should be rejected."""
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(users=[(user, "owner")])
    url = f"/api/v1.0/documents/{document.id!s}/attachment-upload/"

    file = SimpleUploadedFile(name="test.png", content=b"")
    response = client.post(url, {"file": file}, format="multipart")

    assert response.status_code == 400
    assert response.json() == {"file": ["The submitted file is empty."]}


def test_api_documents_attachment_upload_unsafe():
    """A file with an unsafe mime type should be tagged as such."""
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(users=[(user, "owner")])
    url = f"/api/v1.0/documents/{document.id!s}/attachment-upload/"

    file = SimpleUploadedFile(
        name="script.exe", content=b"\x4d\x5a\x90\x00\x03\x00\x00\x00"
    )
    response = client.post(url, {"file": file}, format="multipart")

    assert response.status_code == 201

    file_path = response.json()["file"]
    pattern = re.compile(rf"^/media/{document.id!s}/attachments/(.*)\.exe")
    match = pattern.search(file_path)
    file_id = match.group(1)

    # Validate that file_id is a valid UUID
    uuid.UUID(file_id)

    # Now, check the metadata of the uploaded file
    key = file_path.replace("/media", "")
    file_head = default_storage.connection.meta.client.head_object(
        Bucket=default_storage.bucket_name, Key=key
    )
    assert file_head["Metadata"] == {"owner": str(user.id), "is_unsafe": "true"}
