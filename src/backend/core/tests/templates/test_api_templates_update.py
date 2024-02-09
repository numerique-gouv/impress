"""
Tests for Templates API endpoint in publish's core app: update
"""
import random

import pytest
from rest_framework.test import APIClient

from core import factories
from core.api import serializers
from core.tests.utils import OIDCToken

pytestmark = pytest.mark.django_db


def test_api_templates_update_anonymous():
    """Anonymous users should not be allowed to update a template."""
    template = factories.TemplateFactory()
    old_template_values = serializers.TemplateSerializer(instance=template).data

    new_template_values = serializers.TemplateSerializer(
        instance=factories.TemplateFactory()
    ).data
    response = APIClient().put(
        f"/api/v1.0/templates/{template.id!s}/",
        new_template_values,
        format="json",
    )
    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }

    template.refresh_from_db()
    template_values = serializers.TemplateSerializer(instance=template).data
    assert template_values == old_template_values


def test_api_templates_update_authenticated_unrelated():
    """
    Authenticated users should not be allowed to update a template to which they are not related.
    """
    user = factories.UserFactory()
    jwt_token = OIDCToken.for_user(user)

    template = factories.TemplateFactory(is_public=False)
    old_template_values = serializers.TemplateSerializer(instance=template).data

    new_template_values = serializers.TemplateSerializer(
        instance=factories.TemplateFactory()
    ).data
    response = APIClient().put(
        f"/api/v1.0/templates/{template.id!s}/",
        new_template_values,
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}

    template.refresh_from_db()
    template_values = serializers.TemplateSerializer(instance=template).data
    assert template_values == old_template_values


def test_api_templates_update_authenticated_members():
    """
    Users who are members of a template but not administrators should
    not be allowed to update it.
    """
    user = factories.UserFactory()
    jwt_token = OIDCToken.for_user(user)

    template = factories.TemplateFactory(users=[(user, "member")])
    old_template_values = serializers.TemplateSerializer(instance=template).data

    new_template_values = serializers.TemplateSerializer(
        instance=factories.TemplateFactory()
    ).data
    response = APIClient().put(
        f"/api/v1.0/templates/{template.id!s}/",
        new_template_values,
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }

    template.refresh_from_db()
    template_values = serializers.TemplateSerializer(instance=template).data
    assert template_values == old_template_values


@pytest.mark.parametrize("role", ["administrator", "owner"])
def test_api_templates_update_authenticated_administrators(role):
    """Administrators of a template should be allowed to update it."""
    user = factories.UserFactory()
    jwt_token = OIDCToken.for_user(user)

    template = factories.TemplateFactory(users=[(user, role)])
    old_template_values = serializers.TemplateSerializer(instance=template).data

    new_template_values = serializers.TemplateSerializer(
        instance=factories.TemplateFactory()
    ).data
    response = APIClient().put(
        f"/api/v1.0/templates/{template.id!s}/",
        new_template_values,
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )
    assert response.status_code == 200

    template.refresh_from_db()
    template_values = serializers.TemplateSerializer(instance=template).data
    for key, value in template_values.items():
        if key in ["id", "accesses"]:
            assert value == old_template_values[key]
        else:
            assert value == new_template_values[key]


def test_api_templates_update_administrator_or_owner_of_another():
    """
    Being administrator or owner of a template should not grant authorization to update
    another template.
    """
    user = factories.UserFactory()
    jwt_token = OIDCToken.for_user(user)

    factories.TemplateFactory(users=[(user, random.choice(["administrator", "owner"]))])
    is_public = random.choice([True, False])
    template = factories.TemplateFactory(title="Old title", is_public=is_public)
    old_template_values = serializers.TemplateSerializer(instance=template).data

    new_template_values = serializers.TemplateSerializer(
        instance=factories.TemplateFactory()
    ).data
    response = APIClient().put(
        f"/api/v1.0/templates/{template.id!s}/",
        new_template_values,
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 403 if is_public else 404

    template.refresh_from_db()
    template_values = serializers.TemplateSerializer(instance=template).data
    assert template_values == old_template_values
