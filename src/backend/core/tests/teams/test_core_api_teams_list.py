"""
Tests for Teams API endpoint in publish's core app: list
"""
from unittest import mock

import pytest
from rest_framework.pagination import PageNumberPagination
from rest_framework.status import HTTP_200_OK, HTTP_401_UNAUTHORIZED
from rest_framework.test import APIClient

from core import factories, models
from core.api import serializers

from ..utils import OIDCToken

pytestmark = pytest.mark.django_db


def test_api_teams_list_anonymous():
    """Anonymous users should not be allowed to list teams."""
    factories.TeamFactory.create_batch(2)

    response = APIClient().get("/api/v1.0/teams/")

    assert response.status_code == HTTP_401_UNAUTHORIZED
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }


def test_api_teams_list_authenticated():
    """Authenticated users should be able to list teams they are an owner/administrator/member of."""
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    expected_ids = {
        str(access.team.id)
        for access in factories.TeamAccessFactory.create_batch(5, user=user)
    }
    factories.TeamFactory.create_batch(2)  # Other teams

    response = APIClient().get(
        "/api/v1.0/teams/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
    )

    assert response.status_code == HTTP_200_OK
    results = response.json()["results"]
    assert len(results) == 5
    results_id = {result["id"] for result in results}
    assert expected_ids == results_id


@mock.patch.object(PageNumberPagination, "get_page_size", return_value=2)
def test_api_teams_list_pagination(
    _mock_page_size,
):
    """Pagination should work as expected."""
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team_ids = [
        str(access.team.id)
        for access in factories.TeamAccessFactory.create_batch(3, user=user)
    ]

    # Get page 1
    response = APIClient().get(
        "/api/v1.0/teams/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
    )

    assert response.status_code == HTTP_200_OK
    content = response.json()

    assert content["count"] == 3
    assert content["next"] == "http://testserver/api/v1.0/teams/?page=2"
    assert content["previous"] is None

    assert len(content["results"]) == 2
    for item in content["results"]:
        team_ids.remove(item["id"])

    # Get page 2
    response = APIClient().get(
        "/api/v1.0/teams/?page=2", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
    )

    assert response.status_code == HTTP_200_OK
    content = response.json()

    assert content["count"] == 3
    assert content["next"] is None
    assert content["previous"] == "http://testserver/api/v1.0/teams/"

    assert len(content["results"]) == 1
    team_ids.remove(content["results"][0]["id"])
    assert team_ids == []


def test_api_teams_list_authenticated_distinct():
    """A team with several related users should only be listed once."""
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    other_user = factories.UserFactory()

    team = factories.TeamFactory(users=[user, other_user])

    response = APIClient().get(
        "/api/v1.0/teams/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
    )

    assert response.status_code == HTTP_200_OK
    content = response.json()
    assert len(content["results"]) == 1
    assert content["results"][0]["id"] == str(team.id)
