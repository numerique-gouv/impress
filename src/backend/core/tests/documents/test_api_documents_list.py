"""
Tests for Documents API endpoint in impress's core app: list
"""

import operator
import random
from unittest import mock
from urllib.parse import urlencode

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


def test_api_documents_list_format():
    """Validate the format of documents as returned by the list view."""
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    other_users = factories.UserFactory.create_batch(3)
    document = factories.DocumentFactory(
        users=[user, *factories.UserFactory.create_batch(2)],
        favorited_by=[user, *other_users],
        link_traces=other_users,
    )

    response = client.get("/api/v1.0/documents/")

    assert response.status_code == 200
    content = response.json()
    results = content.pop("results")
    assert content == {
        "count": 1,
        "next": None,
        "previous": None,
    }
    assert len(results) == 1
    assert results[0] == {
        "id": str(document.id),
        "abilities": document.get_abilities(user),
        "content": document.content,
        "created_at": document.created_at.isoformat().replace("+00:00", "Z"),
        "creator": str(document.creator.id),
        "is_favorite": True,
        "link_reach": document.link_reach,
        "link_role": document.link_role,
        "nb_accesses": 3,
        "title": document.title,
        "updated_at": document.updated_at.isoformat().replace("+00:00", "Z"),
    }


def test_api_documents_list_authenticated_direct(django_assert_num_queries):
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

    with django_assert_num_queries(3):
        response = client.get("/api/v1.0/documents/")

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 2
    results_id = {result["id"] for result in results}
    assert expected_ids == results_id


def test_api_documents_list_authenticated_via_team(
    django_assert_num_queries, mock_user_teams
):
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

    with django_assert_num_queries(3):
        response = client.get("/api/v1.0/documents/")

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 5
    results_id = {result["id"] for result in results}
    assert expected_ids == results_id


def test_api_documents_list_authenticated_link_reach_restricted(
    django_assert_num_queries,
):
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

    with django_assert_num_queries(3):
        response = client.get(
            "/api/v1.0/documents/",
        )

    assert response.status_code == 200
    results = response.json()["results"]
    # Only the other document is returned but not the restricted document even though the user
    # visited it earlier (probably b/c it previously had public or authenticated reach...)
    assert len(results) == 1
    assert results[0]["id"] == str(other_document.id)


def test_api_documents_list_authenticated_link_reach_public_or_authenticated(
    django_assert_num_queries,
):
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

    with django_assert_num_queries(3):
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


def test_api_documents_list_favorites_no_extra_queries(django_assert_num_queries):
    """
    Ensure that marking documents as favorite does not generate additional queries
    when fetching the document list.
    """
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    special_documents = factories.DocumentFactory.create_batch(3, users=[user])
    factories.DocumentFactory.create_batch(2, users=[user])

    url = "/api/v1.0/documents/"
    with django_assert_num_queries(3):
        response = client.get(url)

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 5

    assert all(result["is_favorite"] is False for result in results)

    # Mark documents as favorite and check results again
    for document in special_documents:
        models.DocumentFavorite.objects.create(document=document, user=user)

    with django_assert_num_queries(3):
        response = client.get(url)

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 5

    # Check if the "is_favorite" annotation is correctly set for the favorited documents
    favorited_ids = {str(doc.id) for doc in special_documents}
    for result in results:
        if result["id"] in favorited_ids:
            assert result["is_favorite"] is True
        else:
            assert result["is_favorite"] is False


def test_api_documents_list_filter_and_access_rights():
    """Filtering on querystring parameters should respect access rights."""
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    other_user = factories.UserFactory()

    def random_favorited_by():
        return random.choice([[], [user], [other_user]])

    # Documents that should be listed to this user
    listed_documents = [
        factories.DocumentFactory(
            link_reach="public",
            link_traces=[user],
            favorited_by=random_favorited_by(),
            creator=random.choice([user, other_user]),
        ),
        factories.DocumentFactory(
            link_reach="authenticated",
            link_traces=[user],
            favorited_by=random_favorited_by(),
            creator=random.choice([user, other_user]),
        ),
        factories.DocumentFactory(
            link_reach="restricted",
            users=[user],
            favorited_by=random_favorited_by(),
            creator=random.choice([user, other_user]),
        ),
    ]
    listed_ids = [str(doc.id) for doc in listed_documents]
    word_list = [word for doc in listed_documents for word in doc.title.split(" ")]

    # Documents that should not be listed to this user
    factories.DocumentFactory(
        link_reach="public",
        favorited_by=random_favorited_by(),
        creator=random.choice([user, other_user]),
    )
    factories.DocumentFactory(
        link_reach="authenticated",
        favorited_by=random_favorited_by(),
        creator=random.choice([user, other_user]),
    )
    factories.DocumentFactory(
        link_reach="restricted",
        favorited_by=random_favorited_by(),
        creator=random.choice([user, other_user]),
    )
    factories.DocumentFactory(
        link_reach="restricted",
        link_traces=[user],
        favorited_by=random_favorited_by(),
        creator=random.choice([user, other_user]),
    )

    filters = {
        "link_reach": random.choice([None, *models.LinkReachChoices.values]),
        "title": random.choice([None, *word_list]),
        "favorite": random.choice([None, True, False]),
        "creator": random.choice([None, user, other_user]),
        "ordering": random.choice(
            [
                None,
                "created_at",
                "-created_at",
                "is_favorite",
                "-is_favorite",
                "nb_accesses",
                "-nb_accesses",
                "title",
                "-title",
                "updated_at",
                "-updated_at",
            ]
        ),
    }
    query_params = {key: value for key, value in filters.items() if value is not None}
    querystring = urlencode(query_params)

    response = client.get(f"/api/v1.0/documents/?{querystring:s}")

    assert response.status_code == 200
    results = response.json()["results"]

    # Ensure all documents in results respect expected access rights
    for result in results:
        assert result["id"] in listed_ids


# Filters: ordering


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
        "is_favorite",
        "-is_favorite",
        "nb_accesses",
        "-nb_accesses",
        "title",
        "-title",
        "updated_at",
        "-updated_at",
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


# Filters: is_creator_me


def test_api_documents_list_filter_is_creator_me_true():
    """
    Authenticated users should be able to filter documents they created.
    """
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    factories.DocumentFactory.create_batch(3, users=[user], creator=user)
    factories.DocumentFactory.create_batch(2, users=[user])

    response = client.get("/api/v1.0/documents/?is_creator_me=true")

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 3

    # Ensure all results are created by the current user
    for result in results:
        assert result["creator"] == str(user.id)


def test_api_documents_list_filter_is_creator_me_false():
    """
    Authenticated users should be able to filter documents created by others.
    """
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    factories.DocumentFactory.create_batch(3, users=[user], creator=user)
    factories.DocumentFactory.create_batch(2, users=[user])

    response = client.get("/api/v1.0/documents/?is_creator_me=false")

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 2

    # Ensure all results are created by other users
    for result in results:
        assert result["creator"] != str(user.id)


def test_api_documents_list_filter_is_creator_me_invalid():
    """Filtering with an invalid `is_creator_me` value should do nothing."""
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    factories.DocumentFactory.create_batch(3, users=[user], creator=user)
    factories.DocumentFactory.create_batch(2, users=[user])

    response = client.get("/api/v1.0/documents/?is_creator_me=invalid")

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 5


# Filters: is_favorite


def test_api_documents_list_filter_is_favorite_true():
    """
    Authenticated users should be able to filter documents they marked as favorite.
    """
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    factories.DocumentFactory.create_batch(3, users=[user], favorited_by=[user])
    factories.DocumentFactory.create_batch(2, users=[user])

    response = client.get("/api/v1.0/documents/?is_favorite=true")

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 3

    # Ensure all results are marked as favorite by the current user
    for result in results:
        assert result["is_favorite"] is True


def test_api_documents_list_filter_is_favorite_false():
    """
    Authenticated users should be able to filter documents they didn't mark as favorite.
    """
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    factories.DocumentFactory.create_batch(3, users=[user], favorited_by=[user])
    factories.DocumentFactory.create_batch(2, users=[user])

    response = client.get("/api/v1.0/documents/?is_favorite=false")

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 2

    # Ensure all results are not marked as favorite by the current user
    for result in results:
        assert result["is_favorite"] is False


def test_api_documents_list_filter_is_favorite_invalid():
    """Filtering with an invalid `is_favorite` value should do nothing."""
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    factories.DocumentFactory.create_batch(3, users=[user], favorited_by=[user])
    factories.DocumentFactory.create_batch(2, users=[user])

    response = client.get("/api/v1.0/documents/?is_favorite=invalid")

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 5


# Filters: link_reach


@pytest.mark.parametrize("reach", models.LinkReachChoices.values)
def test_api_documents_list_filter_link_reach(reach):
    """Authenticated users should be able to filter documents by link reach."""
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    factories.DocumentFactory.create_batch(5, users=[user])

    response = client.get(f"/api/v1.0/documents/?link_reach={reach:s}")

    assert response.status_code == 200
    results = response.json()["results"]

    # Ensure all results have the chosen link reach
    for result in results:
        assert result["link_reach"] == reach


def test_api_documents_list_filter_link_reach_invalid():
    """Filtering with an invalid `link_reach` value should raise an error."""
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    factories.DocumentFactory.create_batch(3, users=[user])

    response = client.get("/api/v1.0/documents/?link_reach=invalid")

    assert response.status_code == 400
    assert response.json() == {
        "link_reach": [
            "Select a valid choice. invalid is not one of the available choices."
        ]
    }


# Filters: title


@pytest.mark.parametrize(
    "query,nb_results",
    [
        ("Project Alpha", 1),  # Exact match
        ("project", 2),  # Partial match (case-insensitive)
        ("Guide", 1),  # Word match within a title
        ("Special", 0),  # No match (nonexistent keyword)
        ("2024", 2),  # Match by numeric keyword
        ("", 5),  # Empty string
    ],
)
def test_api_documents_list_filter_title(query, nb_results):
    """Authenticated users should be able to search documents by their title."""
    user = factories.UserFactory()
    client = APIClient()
    client.force_login(user)

    # Create documents with predefined titles
    titles = [
        "Project Alpha Documentation",
        "Project Beta Overview",
        "User Guide",
        "Financial Report 2024",
        "Annual Review 2024",
    ]
    for title in titles:
        factories.DocumentFactory(title=title, users=[user])

    # Perform the search query
    response = client.get(f"/api/v1.0/documents/?title={query:s}")

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == nb_results

    # Ensure all results contain the query in their title
    for result in results:
        assert query.lower().strip() in result["title"].lower()
