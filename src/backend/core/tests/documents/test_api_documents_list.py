"""
Tests for Documents API endpoint in impress's core app: list
"""

import operator
from unittest import mock

import pytest
from faker import Faker
from rest_framework.pagination import PageNumberPagination
from rest_framework.test import APIClient

from core import factories, models

fake = Faker()
pytestmark = pytest.mark.django_db


@pytest.mark.parametrize("role", models.LinkRoleChoices.values)
@pytest.mark.parametrize("reach", models.LinkReachChoices.values)
def test_api_documents_list_anonymous(reach, role):
    """
    Anonymous users should not be allowed to list documents whatever the
    link reach and the role
    """
    factories.DocumentFactory(link_reach=reach, link_role=role)

    response = APIClient().get("/api/v1.0/documents/")

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 0


def test_api_documents_list_authenticated_direct():
    """
    Authenticated users should be able to list documents they are a direct
    owner/administrator/member of or documents that have a link reach other
    than restricted.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    documents = [
        access.document
        for access in factories.UserDocumentAccessFactory.create_batch(2, user=user)
    ]

    # Unrelated and untraced documents
    for reach in models.LinkReachChoices:
        for role in models.LinkRoleChoices:
            factories.DocumentFactory(link_reach=reach, link_role=role)

    expected_ids = {str(document.id) for document in documents}

    response = client.get(
        "/api/v1.0/documents/",
    )

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 2
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

    expected_ids = {str(document.id) for document in documents_team1 + documents_team2}

    response = client.get("/api/v1.0/documents/")

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 5
    results_id = {result["id"] for result in results}
    assert expected_ids == results_id


def test_api_documents_list_authenticated_link_reach_restricted():
    """
    An authenticated user who has link traces to a document that is restricted should not
    see it on the list view
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory(link_traces=[user], link_reach="restricted")

    # Link traces for other documents or other users should not interfere
    models.LinkTrace.objects.create(document=document, user=factories.UserFactory())
    other_document = factories.DocumentFactory(link_reach="public")
    models.LinkTrace.objects.create(document=other_document, user=user)

    response = client.get(
        "/api/v1.0/documents/",
    )

    assert response.status_code == 200
    results = response.json()["results"]
    # Only the other document is returned but not the restricted document even though the user
    # visited it earlier (probably b/c it previously had public or authenticated reach...)
    assert len(results) == 1
    assert results[0]["id"] == str(other_document.id)


def test_api_documents_list_authenticated_link_reach_public_or_authenticated():
    """
    An authenticated user who has link traces to a document with public or authenticated
    link reach should see it on the list view.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    documents = [
        factories.DocumentFactory(link_traces=[user], link_reach=reach)
        for reach in models.LinkReachChoices
        if reach != "restricted"
    ]
    expected_ids = {str(document.id) for document in documents}

    response = client.get(
        "/api/v1.0/documents/",
    )

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 2
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

    document = factories.DocumentFactory(users=[user, other_user])

    response = client.get(
        "/api/v1.0/documents/",
    )

    assert response.status_code == 200
    content = response.json()
    assert len(content["results"]) == 1
    assert content["results"][0]["id"] == str(document.id)


def test_api_documents_list_ordering_default():
    """Documents should be ordered by descending "updated_at" by default"""
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    factories.DocumentFactory.create_batch(5, users=[user])

    response = client.get("/api/v1.0/documents/")

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 5

    # Check that results are sorted by descending "updated_at" as expected
    for i in range(4):
        assert operator.ge(results[i]["updated_at"], results[i + 1]["updated_at"])


def test_api_documents_list_ordering_by_fields():
    """It should be possible to order by several fields"""
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    factories.DocumentFactory.create_batch(5, users=[user])

    for parameter in [
        "created_at",
        "-created_at",
        "updated_at",
        "-updated_at",
        "title",
        "-title",
    ]:
        is_descending = parameter.startswith("-")
        field = parameter.lstrip("-")
        querystring = f"?ordering={parameter}"

        response = client.get(f"/api/v1.0/documents/{querystring:s}")
        assert response.status_code == 200
        results = response.json()["results"]
        assert len(results) == 5

        # Check that results are sorted by the field in querystring as expected
        compare = operator.ge if is_descending else operator.le
        for i in range(4):
            assert compare(results[i][field], results[i + 1][field])
