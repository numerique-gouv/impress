"""
Tests for Templates API endpoint in impress's core app: delete
"""

import random

import pytest
from rest_framework.test import APIClient

from core import factories, models
from core.tests.conftest import TEAM, USER, VIA

pytestmark = pytest.mark.django_db


def test_api_templates_delete_anonymous():
    """Anonymous users should not be allowed to destroy a template."""
    template = factories.TemplateFactory()

    response = APIClient().delete(
        f"/api/v1.0/templates/{template.id!s}/",
    )

    assert response.status_code == 401
    assert models.Template.objects.count() == 1


def test_api_templates_delete_authenticated_unrelated():
    """
    Authenticated users should not be allowed to delete a template to which they are not
    related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    is_public = random.choice([True, False])
    template = factories.TemplateFactory(is_public=is_public)

    response = client.delete(
        f"/api/v1.0/templates/{template.id!s}/",
    )

    assert response.status_code == 403 if is_public else 404
    assert models.Template.objects.count() == 1


@pytest.mark.parametrize("role", ["reader", "editor", "administrator"])
@pytest.mark.parametrize("via", VIA)
def test_api_templates_delete_authenticated_member_or_administrator(
    via, role, mock_user_teams
):
    """
    Authenticated users should not be allowed to delete a template for which they are
    only a member or administrator.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory()
    if via == USER:
        factories.UserTemplateAccessFactory(template=template, user=user, role=role)
    elif via == TEAM:
        mock_user_teams.return_value = ["lasuite", "unknown"]
        factories.TeamTemplateAccessFactory(
            template=template, team="lasuite", role=role
        )

    response = client.delete(
        f"/api/v1.0/templates/{template.id}/",
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }
    assert models.Template.objects.count() == 1


@pytest.mark.parametrize("via", VIA)
def test_api_templates_delete_authenticated_owner(via, mock_user_teams):
    """
    Authenticated users should be able to delete a template they own.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory()
    if via == USER:
        factories.UserTemplateAccessFactory(template=template, user=user, role="owner")
    elif via == TEAM:
        mock_user_teams.return_value = ["lasuite", "unknown"]
        factories.TeamTemplateAccessFactory(
            template=template, team="lasuite", role="owner"
        )

    response = client.delete(
        f"/api/v1.0/templates/{template.id}/",
    )

    assert response.status_code == 204
    assert models.Template.objects.exists() is False
