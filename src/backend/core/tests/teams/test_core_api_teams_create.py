"""
Tests for Teams API endpoint in publish's core app: create
"""
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from core.factories import IdentityFactory, TeamFactory, UserFactory
from core.models import Team

from ..utils import OIDCToken

pytestmark = pytest.mark.django_db


def test_api_teams_create_anonymous():
    """Anonymous users should not be allowed to create teams."""
    response = APIClient().post(
        "/api/v1.0/teams/",
        {
            "name": "my team",
        },
    )

    assert response.status_code == 401
    assert not Team.objects.exists()


def test_api_teams_create_authenticated():
    """
    Authenticated users should be able to create teams and should automatically be declared
    as the owner of the newly created team.
    """
    identity = IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    response = APIClient().post(
        "/api/v1.0/teams/",
        {
            "name": "my team",
        },
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 201
    team = Team.objects.get()
    assert team.name == "my team"
    assert team.accesses.filter(role="owner", user=user).exists()
