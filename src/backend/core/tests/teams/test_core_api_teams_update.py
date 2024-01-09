"""
Tests for Teams API endpoint in publish's core app: update
"""
import random

import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from core import factories, models
from core.api import serializers

from ..utils import OIDCToken

pytestmark = pytest.mark.django_db


def test_api_teams_update_anonymous():
    """Anonymous users should not be allowed to update a team."""
    team = factories.TeamFactory()
    old_team_values = serializers.TeamSerializer(instance=team).data

    new_team_values = serializers.TeamSerializer(instance=factories.TeamFactory()).data
    response = APIClient().put(
        f"/api/v1.0/teams/{team.id!s}/",
        new_team_values,
        format="json",
    )
    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }

    team.refresh_from_db()
    team_values = serializers.TeamSerializer(instance=team).data
    assert team_values == old_team_values


def test_api_teams_update_authenticated_unrelated():
    """
    Authenticated users should not be allowed to update a team to which they are not related.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory()
    old_team_values = serializers.TeamSerializer(instance=team).data

    new_team_values = serializers.TeamSerializer(instance=factories.TeamFactory()).data
    response = APIClient().put(
        f"/api/v1.0/teams/{team.id!s}/",
        new_team_values,
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}

    team.refresh_from_db()
    team_values = serializers.TeamSerializer(instance=team).data
    assert team_values == old_team_values


def test_api_teams_update_authenticated_members():
    """
    Users who are members of a team but not administrators should
    not be allowed to update it.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "member")])
    old_team_values = serializers.TeamSerializer(instance=team).data

    new_team_values = serializers.TeamSerializer(instance=factories.TeamFactory()).data
    response = APIClient().put(
        f"/api/v1.0/teams/{team.id!s}/",
        new_team_values,
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }

    team.refresh_from_db()
    team_values = serializers.TeamSerializer(instance=team).data
    assert team_values == old_team_values


def test_api_teams_update_authenticated_administrators():
    """Administrators of a team should be allowed to update it."""
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "administrator")])
    old_team_values = serializers.TeamSerializer(instance=team).data

    new_team_values = serializers.TeamSerializer(instance=factories.TeamFactory()).data
    response = APIClient().put(
        f"/api/v1.0/teams/{team.id!s}/",
        new_team_values,
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )
    assert response.status_code == 200

    team.refresh_from_db()
    team_values = serializers.TeamSerializer(instance=team).data
    for key, value in team_values.items():
        if key in ["id", "accesses"]:
            assert value == old_team_values[key]
        else:
            assert value == new_team_values[key]


def test_api_teams_update_authenticated_owners():
    """Administrators of a team should be allowed to update it."""
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "owner")])
    old_team_values = serializers.TeamSerializer(instance=team).data

    new_team_values = serializers.TeamSerializer(instance=factories.TeamFactory()).data
    response = APIClient().put(
        f"/api/v1.0/teams/{team.id!s}/",
        new_team_values,
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )
    assert response.status_code == 200

    team.refresh_from_db()
    team_values = serializers.TeamSerializer(instance=team).data
    for key, value in team_values.items():
        if key in ["id", "accesses"]:
            assert value == old_team_values[key]
        else:
            assert value == new_team_values[key]


def test_api_teams_update_administrator_or_owner_of_another():
    """
    Being administrator or owner of a team should not grant authorization to update
    another team.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    factories.TeamFactory(users=[(user, random.choice(["administrator", "owner"]))])
    team = factories.TeamFactory(name="Old name")
    old_team_values = serializers.TeamSerializer(instance=team).data

    new_team_values = serializers.TeamSerializer(instance=factories.TeamFactory()).data
    response = APIClient().put(
        f"/api/v1.0/teams/{team.id!s}/",
        new_team_values,
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}

    team.refresh_from_db()
    team_values = serializers.TeamSerializer(instance=team).data
    assert team_values == old_team_values
