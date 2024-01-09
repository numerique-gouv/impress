"""
Tests for Teams API endpoint in publish's core app: retrieve
"""
import random
from collections import Counter
from unittest import mock

import pytest
from rest_framework.test import APIClient

from core import factories

from ..utils import OIDCToken

pytestmark = pytest.mark.django_db


def test_api_teams_retrieve_anonymous():
    """Anonymous users should not be allowed to retrieve a team."""
    team = factories.TeamFactory()
    response = APIClient().get(f"/api/v1.0/teams/{team.id}/")

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }


def test_api_teams_retrieve_authenticated_unrelated():
    """
    Authenticated users should not be allowed to retrieve a team to which they are
    not related.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory()

    response = APIClient().get(
        f"/api/v1.0/teams/{team.id!s}/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}


def test_api_teams_retrieve_authenticated_related():
    """
    Authenticated users should be allowed to retrieve a team to which they
    are related whatever the role.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory()
    access1 = factories.TeamAccessFactory(team=team, user=user)
    access2 = factories.TeamAccessFactory(team=team)

    response = APIClient().get(
        f"/api/v1.0/teams/{team.id!s}/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
    )
    assert response.status_code == 200
    content = response.json()
    assert sorted(content.pop("accesses"), key=lambda x: x["user"]) == sorted(
        [
            {
                "id": str(access1.id),
                "user": str(user.id),
                "role": access1.role,
                "abilities": access1.get_abilities(user),
            },
            {
                "id": str(access2.id),
                "user": str(access2.user.id),
                "role": access2.role,
                "abilities": access2.get_abilities(user),
            },
        ],
        key=lambda x: x["user"],
    )
    assert response.json() == {
        "id": str(team.id),
        "name": team.name,
        "abilities": team.get_abilities(user),
    }
