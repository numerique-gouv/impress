"""
Tests for Documents API endpoint in impress's core app: list
"""

from unittest import mock

import pytest
from faker import Faker
from rest_framework.pagination import PageNumberPagination
from rest_framework.test import APIClient

from core import factories

fake = Faker()
pytestmark = pytest.mark.django_db


def test_api_documents_list_anonymous():
    """Anonymous users should only be able to list documents public or not."""
    factories.DocumentFactory.create_batch(2, is_public=False)
    factories.DocumentFactory.create_batch(2, is_public=True)

    response = APIClient().get("/api/v1.0/documents/")

    assert response.status_code == 200
    assert response.json() == {
        "count": 0,
        "next": None,
        "previous": None,
        "results": [],
    }


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
    factories.DocumentFactory.create_batch(2, is_public=True)
    factories.DocumentFactory.create_batch(2, is_public=False)

    expected_ids = {str(document.id) for document in related_documents}

    response = client.get(
        "/api/v1.0/documents/",
    )

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 5
    results_id = {result["id"] for result in results}
    assert expected_ids == results_id


def test_api_documents_list_authenticated_via_team(mock_user_teams):
    """
    Authenticated users should be able to list documents they are a
    owner/administrator/member of via a team.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    mock_user_teams.return_value = ["team1", "team2", "unknown"]

    documents_team1 = [
        access.document
        for access in factories.TeamDocumentAccessFactory.create_batch(2, team="team1")
    ]
    documents_team2 = [
        access.document
        for access in factories.TeamDocumentAccessFactory.create_batch(3, team="team2")
    ]
    factories.DocumentFactory.create_batch(2, is_public=True)
    factories.DocumentFactory.create_batch(2, is_public=False)

    expected_ids = {str(document.id) for document in documents_team1 + documents_team2}

    response = client.get("/api/v1.0/documents/")

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 5
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

    assert response.status_code == 200
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

    assert response.status_code == 200
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

    assert response.status_code == 200
    content = response.json()
    assert len(content["results"]) == 1
    assert content["results"][0]["id"] == str(document.id)


def test_api_documents_order_updated_at_desc_default():
    """
    Test that the endpoint GET documents is sorted in 'updated_at' descending order by default.
    """
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    # Updated at next year to ensure the order is correct
    documents_updated = [
        document.updated_at.isoformat().replace("+00:00", "Z")
        for document in factories.DocumentFactory.create_batch(
            5, updated_at=fake.date_time_this_year(before_now=False), users=[user]
        )
    ]

    documents_updated.sort(reverse=True)

    response = client.get(
        "/api/v1.0/documents/",
    )
    assert response.status_code == 200

    response_data = response.json()

    response_document_updated = [
        document["updated_at"] for document in response_data["results"]
    ]

    assert (
        response_document_updated == documents_updated
    ), "updated_at values are not sorted from newest to oldest"


@pytest.mark.parametrize(
    "ordering_field, factory_field",
    [
        ("-created_at", "created_at"),
        ("-updated_at", "updated_at"),
        ("-title", "title"),
    ],
)
def test_api_documents_ordering_desc(ordering_field, factory_field):
    """
    Test that the specified field is sorted in descending order
    when the 'ordering' query parameter is set.
    """
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    if factory_field == "title":
        documents_field_values = [
            factories.DocumentFactory(
                title=fake.sentence(nb_words=4), users=[user]
            ).title
            for _ in range(5)
        ]
    else:
        documents_field_values = [
            getattr(document, factory_field).isoformat().replace("+00:00", "Z")
            for document in factories.DocumentFactory.create_batch(5, users=[user])
        ]

    documents_field_values.sort(reverse=True)

    response = client.get(
        f"/api/v1.0/documents/?ordering={ordering_field}"
        if ordering_field != "-created_at"
        else "/api/v1.0/documents/",
    )
    assert response.status_code == 200

    response_data = response.json()

    response_documents_field_values = [
        document[factory_field] for document in response_data["results"]
    ]

    assert (
        response_documents_field_values == documents_field_values
    ), f"{factory_field} values are not sorted as expected"


@pytest.mark.parametrize(
    "field",
    [
        ("updated_at"),
        ("title"),
        ("created_at"),
    ],
)
def test_api_documents_ordering_asc(field):
    """
    Test that the specified field is sorted in ascending order
    when the 'ordering' query parameter is set.
    """
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    if field == "title":
        documents_field_values = [
            factories.DocumentFactory(
                users=[user], title=fake.sentence(nb_words=4)
            ).title
            for _ in range(5)
        ]
    else:
        documents_field_values = [
            getattr(document, field).isoformat().replace("+00:00", "Z")
            for document in factories.DocumentFactory.create_batch(5, users=[user])
        ]

    documents_field_values.sort()

    response = client.get(
        f"/api/v1.0/documents/?ordering={field}",
    )
    assert response.status_code == 200

    response_data = response.json()

    response_documents_field_values = [
        document[field] for document in response_data["results"]
    ]

    assert (
        response_documents_field_values == documents_field_values
    ), f"{field} values are not sorted as expected"
