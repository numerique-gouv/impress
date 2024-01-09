"""
Tests for Teams API endpoint in publish's core app: delete
"""
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from core import factories, models

from ..utils import OIDCToken

pytestmark = pytest.mark.django_db


def test_api_teams_delete_anonymous():
    """Anonymous users should not be allowed to destroy a team."""
    team = factories.TeamFactory()

    response = APIClient().delete(
        f"/api/v1.0/teams/{team.id!s}/",
    )

    assert response.status_code == 401
    assert models.Team.objects.count() == 1


def test_api_teams_delete_authenticated_unrelated():
    """
    Authenticated users should not be allowed to delete a team to which they are not
    related.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory()

    response = APIClient().delete(
        f"/api/v1.0/teams/{team.id!s}/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}
    assert models.Team.objects.count() == 1


def test_api_teams_delete_authenticated_member():
    """
    Authenticated users should not be allowed to delete a team for which they are
    only a member.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "member")])

    response = APIClient().delete(
        f"/api/v1.0/teams/{team.id}/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }
    assert models.Team.objects.count() == 1


def test_api_teams_delete_authenticated_administrator():
    """
    Authenticated users should not be allowed to delete a team for which they are
    administrator.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "administrator")])

    response = APIClient().delete(
        f"/api/v1.0/teams/{team.id}/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }
    assert models.Team.objects.count() == 1


def test_api_teams_delete_authenticated_owner():
    """
    Authenticated users should be able to delete a team for which they are directly
    owner.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "owner")])

    response = APIClient().delete(
        f"/api/v1.0/teams/{team.id}/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
    )

    assert response.status_code == 204
    assert models.Team.objects.exists() is False
