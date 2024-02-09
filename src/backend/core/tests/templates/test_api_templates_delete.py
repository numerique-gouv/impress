"""
Tests for Templates API endpoint in publish's core app: delete
"""
import random

import pytest
from rest_framework.test import APIClient

from core import factories, models
from core.tests.utils import OIDCToken

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
    jwt_token = OIDCToken.for_user(user)

    is_public = random.choice([True, False])
    template = factories.TemplateFactory(is_public=is_public)

    response = APIClient().delete(
        f"/api/v1.0/templates/{template.id!s}/",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 403 if is_public else 404
    assert models.Template.objects.count() == 1


@pytest.mark.parametrize("role", ["member", "administrator"])
def test_api_templates_delete_authenticated_member(role):
    """
    Authenticated users should not be allowed to delete a template for which they are
    only a member.
    """
    user = factories.UserFactory()
    jwt_token = OIDCToken.for_user(user)

    template = factories.TemplateFactory(users=[(user, role)])

    response = APIClient().delete(
        f"/api/v1.0/templates/{template.id}/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }
    assert models.Template.objects.count() == 1


def test_api_templates_delete_authenticated_owner():
    """
    Authenticated users should be able to delete a template for which they are directly
    owner.
    """
    user = factories.UserFactory()
    jwt_token = OIDCToken.for_user(user)

    template = factories.TemplateFactory(users=[(user, "owner")])

    response = APIClient().delete(
        f"/api/v1.0/templates/{template.id}/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
    )

    assert response.status_code == 204
    assert models.Template.objects.exists() is False
