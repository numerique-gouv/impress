"""
Tests for Documents API endpoint in impress's core app: list
"""
from unittest import mock

import pytest
from faker import Faker
from rest_framework.pagination import PageNumberPagination
from rest_framework.status import HTTP_200_OK
from rest_framework.test import APIClient

from core import factories

fake = Faker()
pytestmark = pytest.mark.django_db


def test_api_documents_list_anonymous():
    """Anonymous users should only be able to list public documents."""
    factories.DocumentFactory.create_batch(2, is_public=False)
    documents = factories.DocumentFactory.create_batch(2, is_public=True)
    expected_ids = {str(document.id) for document in documents}

    response = APIClient().get("/api/v1.0/documents/")

    assert response.status_code == HTTP_200_OK
    results = response.json()["results"]
    assert len(results) == 2
    results_id = {result["id"] for result in results}
    assert expected_ids == results_id


def test_api_documents_list_authenticated_direct():
    """
    Authenticated users should be able to list documents they are a direct
    owner/administrator/member of.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    related_documents = [
        access.document
        for access in factories.UserDocumentAccessFactory.create_batch(5, user=user)
    ]
    public_documents = factories.DocumentFactory.create_batch(2, is_public=True)
    factories.DocumentFactory.create_batch(2, is_public=False)

    expected_ids = {
        str(document.id) for document in related_documents + public_documents
    }

    response = client.get(
        "/api/v1.0/documents/",
    )

    assert response.status_code == HTTP_200_OK
    results = response.json()["results"]
    assert len(results) == 7
    results_id = {result["id"] for result in results}
    assert expected_ids == results_id


def test_api_documents_list_authenticated_via_team(mock_user_get_teams):
    """
    Authenticated users should be able to list documents they are a
    owner/administrator/member of via a team.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    mock_user_get_teams.return_value = ["team1", "team2", "unknown"]

    documents_team1 = [
        access.document
        for access in factories.TeamDocumentAccessFactory.create_batch(2, team="team1")
    ]
    documents_team2 = [
        access.document
        for access in factories.TeamDocumentAccessFactory.create_batch(3, team="team2")
    ]
    public_documents = factories.DocumentFactory.create_batch(2, is_public=True)
    factories.DocumentFactory.create_batch(2, is_public=False)

    expected_ids = {
        str(document.id)
        for document in documents_team1 + documents_team2 + public_documents
    }

    response = client.get("/api/v1.0/documents/")

    assert response.status_code == HTTP_200_OK
    results = response.json()["results"]
    assert len(results) == 7
    results_id = {result["id"] for result in results}
    assert expected_ids == results_id


@mock.patch.object(PageNumberPagination, "get_page_size", return_value=2)
def test_api_documents_list_pagination(
    _mock_page_size,
):
    """Pagination should work as expected."""
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document_ids = [
        str(access.document_id)
        for access in factories.UserDocumentAccessFactory.create_batch(3, user=user)
    ]

    # Get page 1
    response = client.get(
        "/api/v1.0/documents/",
    )

    assert response.status_code == HTTP_200_OK
    content = response.json()

    assert content["count"] == 3
    assert content["next"] == "http://testserver/api/v1.0/documents/?page=2"
    assert content["previous"] is None

    assert len(content["results"]) == 2
    for item in content["results"]:
        document_ids.remove(item["id"])

    # Get page 2
    response = client.get(
        "/api/v1.0/documents/?page=2",
    )

    assert response.status_code == HTTP_200_OK
    content = response.json()

    assert content["count"] == 3
    assert content["next"] is None
    assert content["previous"] == "http://testserver/api/v1.0/documents/"

    assert len(content["results"]) == 1
    document_ids.remove(content["results"][0]["id"])
    assert document_ids == []


def test_api_documents_list_authenticated_distinct():
    """A document with several related users should only be listed once."""
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    other_user = factories.UserFactory()

    document = factories.DocumentFactory(users=[user, other_user], is_public=True)

    response = client.get(
        "/api/v1.0/documents/",
    )

    assert response.status_code == HTTP_200_OK
    content = response.json()
    assert len(content["results"]) == 1
    assert content["results"][0]["id"] == str(document.id)


def test_api_documents_order_created_at_desc():
    """
    Test that the endpoint GET documents is sorted in 'created_at' descending order by default.
    """
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    documents_created = [
        document.created_at.isoformat().replace("+00:00", "Z")
        for document in factories.DocumentFactory.create_batch(5, is_public=True)
    ]

    documents_created.sort(reverse=True)

    response = client.get(
        "/api/v1.0/documents/",
    )

    assert response.status_code == 200

    response_data = response.json()
    response_document_created = [
        document["created_at"] for document in response_data["results"]
    ]

    assert (
        response_document_created == documents_created
    ), "created_at values are not sorted from newest to oldest"


def test_api_documents_order_created_at_asc():
    """
    Test that the 'created_at' field is sorted in ascending order
    when the 'ordering' query parameter is set.
    """
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    documents_created = [
        document.created_at.isoformat().replace("+00:00", "Z")
        for document in factories.DocumentFactory.create_batch(5, is_public=True)
    ]

    documents_created.sort()

    response = client.get(
        "/api/v1.0/documents/?ordering=created_at",
    )

    assert response.status_code == 200

    response_data = response.json()
    response_document_created = [
        document["created_at"] for document in response_data["results"]
    ]

    assert (
        response_document_created == documents_created
    ), "created_at values are not sorted from oldest to newest"


def test_api_documents_order_updated_at_desc():
    """
    Test that the 'updated_at' field is sorted in descending order
    when the 'ordering' query parameter is set.
    """
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    documents_updated = [
        document.updated_at.isoformat().replace("+00:00", "Z")
        for document in factories.DocumentFactory.create_batch(5, is_public=True)
    ]

    documents_updated.sort(reverse=True)

    response = APIClient().get(
        "/api/v1.0/documents/?ordering=-updated_at",
    )
    assert response.status_code == 200

    response_data = response.json()

    response_document_updated = [
        document["updated_at"] for document in response_data["results"]
    ]

    assert (
        response_document_updated == documents_updated
    ), "updated_at values are not sorted from newest to oldest"


def test_api_documents_order_updated_at_asc():
    """
    Test that the 'updated_at' field is sorted in ascending order
    when the 'ordering' query parameter is set.
    """
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    documents_updated = [
        document.updated_at.isoformat().replace("+00:00", "Z")
        for document in factories.DocumentFactory.create_batch(5, is_public=True)
    ]

    documents_updated.sort()

    response = APIClient().get(
        "/api/v1.0/documents/?ordering=updated_at",
    )
    assert response.status_code == 200

    response_data = response.json()

    response_document_updated = [
        document["updated_at"] for document in response_data["results"]
    ]

    assert (
        response_document_updated == documents_updated
    ), "updated_at values are not sorted from oldest to newest"


def test_api_documents_order_title_desc():
    """
    Test that the 'title' field is sorted in descending order
    when the 'ordering' query parameter is set.
    """
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    documents_title = [
        factories.DocumentFactory(is_public=True, title=fake.sentence(nb_words=4)).title
        for _ in range(5)
    ]

    documents_title.sort(reverse=True)

    response = APIClient().get(
        "/api/v1.0/documents/?ordering=-title",
    )
    assert response.status_code == 200

    response_data = response.json()

    response_documents_title = [
        document["title"] for document in response_data["results"]
    ]

    assert (
        response_documents_title == documents_title
    ), "title values are not sorted descending"


def test_api_documents_order_title_asc():
    """
    Test that the 'title' field is sorted in ascending order
    when the 'ordering' query parameter is set.
    """
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    documents_title = [
        factories.DocumentFactory(is_public=True, title=fake.sentence(nb_words=4)).title
        for _ in range(5)
    ]

    documents_title.sort()

    response = APIClient().get(
        "/api/v1.0/documents/?ordering=title",
    )
    assert response.status_code == 200

    response_data = response.json()

    response_documents_title = [
        document["title"] for document in response_data["results"]
    ]

    assert (
        response_documents_title == documents_title
    ), "title values are not sorted ascending"
