"""
Test document versions API endpoints for users in impress's core app.
"""
import random
import time

import pytest
from rest_framework.test import APIClient

from core import factories, models
from core.tests.conftest import TEAM, USER, VIA

pytestmark = pytest.mark.django_db


def test_api_document_versions_list_anonymous_public():
    """
    Anonymous users should not be allowed to list document versions for a public document.
    """
    document = factories.DocumentFactory(is_public=True)
    factories.UserDocumentAccessFactory.create_batch(2, document=document)

    response = APIClient().get(f"/api/v1.0/documents/{document.id!s}/versions/")

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }


def test_api_document_versions_list_anonymous_private():
    """
    Anonymous users should not be allowed to find document versions for a private document.
    """
    document = factories.DocumentFactory(is_public=False)
    factories.UserDocumentAccessFactory.create_batch(2, document=document)

    response = APIClient().get(f"/api/v1.0/documents/{document.id!s}/versions/")

    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}


def test_api_document_versions_list_authenticated_unrelated_public():
    """
    Authenticated users should not be allowed to list document versions for a public document
    to which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(is_public=True)
    factories.UserDocumentAccessFactory.create_batch(3, document=document)

    # The versions of another document to which the user is related should not be listed either
    factories.UserDocumentAccessFactory(user=user)

    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/versions/",
    )
    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }


def test_api_document_versions_list_authenticated_unrelated_private():
    """
    Authenticated users should not be allowed to find document versions for a private document
    to which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(is_public=False)
    factories.UserDocumentAccessFactory.create_batch(3, document=document)

    # The versions of another document to which the user is related should not be listed either
    factories.UserDocumentAccessFactory(user=user)

    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/versions/",
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}


@pytest.mark.parametrize("via", VIA)
def test_api_document_versions_list_authenticated_related(via, mock_user_get_teams):
    """
    Authenticated users should be able to list document versions for a document
    to which they are directly related, whatever their role in the document.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        models.DocumentAccess.objects.create(
            document=document,
            user=user,
            role=random.choice(models.RoleChoices.choices)[0],
        )
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        models.DocumentAccess.objects.create(
            document=document,
            team="lasuite",
            role=random.choice(models.RoleChoices.choices)[0],
        )

    # Other versions of documents to which the user has access should not be listed
    factories.UserDocumentAccessFactory(user=user)

    # A version created before the user got access should be hidden
    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/versions/",
    )

    assert response.status_code == 200
    content = response.json()
    assert len(content["results"]) == 0
    assert content["count"] == 0

    # Add a new version to the document
    document.content = "new content"
    document.save()

    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/versions/",
    )

    assert response.status_code == 200
    content = response.json()
    assert len(content["results"]) == 1
    assert content["count"] == 1


def test_api_document_versions_retrieve_anonymous_public():
    """
    Anonymous users should not be allowed to retrieve specific versions for a public document.
    """
    document = factories.DocumentFactory(is_public=True)
    version_id = document.get_versions_slice()["versions"][0]["version_id"]

    url = f"/api/v1.0/documents/{document.id!s}/versions/{version_id:s}/"
    response = APIClient().get(url)

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }


def test_api_document_versions_retrieve_anonymous_private():
    """
    Anonymous users should not be allowed to find specific versions for a private document.
    """
    document = factories.DocumentFactory(is_public=False)
    version_id = document.get_versions_slice()["versions"][0]["version_id"]

    url = f"/api/v1.0/documents/{document.id!s}/versions/{version_id:s}/"
    response = APIClient().get(url)

    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}


def test_api_document_versions_retrieve_authenticated_unrelated_public():
    """
    Authenticated users should not be allowed to retrieve specific versions for a public
    document to which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(is_public=True)
    version_id = document.get_versions_slice()["versions"][0]["version_id"]

    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/versions/{version_id:s}/",
    )
    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }


def test_api_document_versions_retrieve_authenticated_unrelated_private():
    """
    Authenticated users should not be allowed to find specific versions for a private document
    to which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(is_public=False)
    version_id = document.get_versions_slice()["versions"][0]["version_id"]

    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/versions/{version_id:s}/",
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}


@pytest.mark.parametrize("via", VIA)
def test_api_document_versions_retrieve_authenticated_related(via, mock_user_get_teams):
    """
    A user who is related to a document should be allowed to retrieve the
    associated document user accesses.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    version_id = document.get_versions_slice()["versions"][0]["version_id"]

    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user)
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(document=document, team="lasuite")

    # Versions created before the document was shared should not be available to the user
    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/versions/{version_id:s}/",
    )

    assert response.status_code == 404

    # Create a new version should make it available to the user
    time.sleep(1)  # minio stores datetimes with the precision of a second
    document.content = "new content"
    document.save()

    version_id = document.get_versions_slice()["versions"][0]["version_id"]

    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/versions/{version_id:s}/",
    )

    assert response.status_code == 200
    assert response.json()["content"] == "new content"


def test_api_document_versions_create_anonymous():
    """Anonymous users should not be allowed to create document versions."""
    document = factories.DocumentFactory()

    response = APIClient().post(
        f"/api/v1.0/documents/{document.id!s}/versions/",
        {"foo": "bar"},
        format="json",
    )

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }


def test_api_document_versions_create_authenticated_unrelated():
    """
    Authenticated users should not be allowed to create document versions for a document to
    which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()

    response = client.post(
        f"/api/v1.0/documents/{document.id!s}/versions/",
        {"foo": "bar"},
        format="json",
    )

    assert response.status_code == 405


@pytest.mark.parametrize("via", VIA)
def test_api_document_versions_create_authenticated_related(via, mock_user_get_teams):
    """
    Authenticated users related to a document should not be allowed to create document versions
    whatever their role.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user)
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(document=document, team="lasuite")

    response = client.post(
        f"/api/v1.0/documents/{document.id!s}/versions/",
        {"foo": "bar"},
        format="json",
    )

    assert response.status_code == 405


def test_api_document_versions_update_anonymous():
    """Anonymous users should not be allowed to update a document version."""
    access = factories.UserDocumentAccessFactory()
    version_id = access.document.get_versions_slice()["versions"][0]["version_id"]

    response = APIClient().put(
        f"/api/v1.0/documents/{access.document_id!s}/versions/{version_id:s}/",
        {"foo": "bar"},
        format="json",
    )
    assert response.status_code == 401


def test_api_document_versions_update_authenticated_unrelated():
    """
    Authenticated users should not be allowed to update a document version for a document to which
    they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    access = factories.UserDocumentAccessFactory()
    version_id = access.document.get_versions_slice()["versions"][0]["version_id"]

    response = client.put(
        f"/api/v1.0/documents/{access.document_id!s}/versions/{version_id:s}/",
        {"foo": "bar"},
        format="json",
    )
    assert response.status_code == 405


@pytest.mark.parametrize("via", VIA)
def test_api_document_versions_update_authenticated_related(via, mock_user_get_teams):
    """
    Authenticated users with access to a document should not be able to update its versions
    whatever their role.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    version_id = document.get_versions_slice()["versions"][0]["version_id"]

    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user)
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(document=document, team="lasuite")

    response = client.put(
        f"/api/v1.0/documents/{document.id!s}/versions/{version_id!s}/",
        {"foo": "bar"},
        format="json",
    )
    assert response.status_code == 405


# Delete


def test_api_document_versions_delete_anonymous():
    """Anonymous users should not be allowed to destroy a document version."""
    access = factories.UserDocumentAccessFactory()

    response = APIClient().delete(
        f"/api/v1.0/documents/{access.document_id!s}/versions/{access.id!s}/",
    )

    assert response.status_code == 401


def test_api_document_versions_delete_authenticated_public():
    """
    Authenticated users should not be allowed to delete a document version for a
    public document to which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(is_public=True)
    version_id = document.get_versions_slice()["versions"][0]["version_id"]

    response = client.delete(
        f"/api/v1.0/documents/{document.id!s}/versions/{version_id:s}/",
    )

    assert response.status_code == 403


def test_api_document_versions_delete_authenticated_private():
    """
    Authenticated users should not be allowed to find a document version to delete it
    for a private document to which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(is_public=False)
    version_id = document.get_versions_slice()["versions"][0]["version_id"]

    response = client.delete(
        f"/api/v1.0/documents/{document.id!s}/versions/{version_id:s}/",
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}


@pytest.mark.parametrize("role", ["reader", "editor"])
@pytest.mark.parametrize("via", VIA)
def test_api_document_versions_delete_reader_or_editor(via, role, mock_user_get_teams):
    """
    Authenticated users should not be allowed to delete a document version for a
    document in which they are a simple reader or editor.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role=role)
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role=role
        )

    # Create a new version should make it available to the user
    time.sleep(1)  # minio stores datetimes with the precision of a second
    document.content = "new content"
    document.save()

    versions = document.get_versions_slice()["versions"]
    assert len(versions) == 2

    version_id = versions[1]["version_id"]
    response = client.delete(
        f"/api/v1.0/documents/{document.id!s}/versions/{version_id:s}/",
    )
    assert response.status_code == 403

    version_id = versions[0]["version_id"]
    response = client.delete(
        f"/api/v1.0/documents/{document.id!s}/versions/{version_id:s}/",
    )
    assert response.status_code == 403

    versions = document.get_versions_slice()["versions"]
    assert len(versions) == 2


@pytest.mark.parametrize("via", VIA)
def test_api_document_versions_delete_administrator_or_owner(via, mock_user_get_teams):
    """
    Users who are administrator or owner of a document should be allowed to delete a version.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    role = random.choice(["administrator", "owner"])
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role=role)
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role=role
        )

    # Create a new version should make it available to the user
    time.sleep(1)  # minio stores datetimes with the precision of a second
    document.content = "new content"
    document.save()

    versions = document.get_versions_slice()["versions"]
    assert len(versions) == 2

    version_id = versions[1]["version_id"]
    response = client.delete(
        f"/api/v1.0/documents/{document.id!s}/versions/{version_id:s}/",
    )
    # 404 because the version was created before the user was given access to the document
    assert response.status_code == 404

    version_id = versions[0]["version_id"]
    response = client.delete(
        f"/api/v1.0/documents/{document.id!s}/versions/{version_id:s}/",
    )
    assert response.status_code == 204

    versions = document.get_versions_slice()["versions"]
    assert len(versions) == 1
