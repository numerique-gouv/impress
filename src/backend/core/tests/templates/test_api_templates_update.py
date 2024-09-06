"""
Tests for Templates API endpoint in impress's core app: update
"""

import random

import pytest
from rest_framework.test import APIClient

from core import factories
from core.api import serializers
from core.tests.conftest import TEAM, USER, VIA

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

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(is_public=False)
    old_template_values = serializers.TemplateSerializer(instance=template).data

    new_template_values = serializers.TemplateSerializer(
        instance=factories.TemplateFactory()
    ).data
    response = client.put(
        f"/api/v1.0/templates/{template.id!s}/",
        new_template_values,
        format="json",
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }

    template.refresh_from_db()
    template_values = serializers.TemplateSerializer(instance=template).data
    assert template_values == old_template_values


@pytest.mark.parametrize("via", VIA)
def test_api_templates_update_authenticated_readers(via, mock_user_teams):
    """
    Users who are readers of a template should not be allowed to update it.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory()
    if via == USER:
        factories.UserTemplateAccessFactory(template=template, user=user, role="reader")
    elif via == TEAM:
        mock_user_teams.return_value = ["lasuite", "unknown"]
        factories.TeamTemplateAccessFactory(
            template=template, team="lasuite", role="reader"
        )

    old_template_values = serializers.TemplateSerializer(instance=template).data

    new_template_values = serializers.TemplateSerializer(
        instance=factories.TemplateFactory()
    ).data
    response = client.put(
        f"/api/v1.0/templates/{template.id!s}/",
        new_template_values,
        format="json",
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }

    template.refresh_from_db()
    template_values = serializers.TemplateSerializer(instance=template).data
    assert template_values == old_template_values


@pytest.mark.parametrize("role", ["editor", "administrator", "owner"])
@pytest.mark.parametrize("via", VIA)
def test_api_templates_update_authenticated_editor_or_administrator_or_owner(
    via, role, mock_user_teams
):
    """Administrator or owner of a template should be allowed to update it."""
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

    old_template_values = serializers.TemplateSerializer(instance=template).data

    new_template_values = serializers.TemplateSerializer(
        instance=factories.TemplateFactory()
    ).data
    response = client.put(
        f"/api/v1.0/templates/{template.id!s}/",
        new_template_values,
        format="json",
    )
    assert response.status_code == 200

    template.refresh_from_db()
    template_values = serializers.TemplateSerializer(instance=template).data
    for key, value in template_values.items():
        if key in ["id", "accesses"]:
            assert value == old_template_values[key]
        else:
            assert value == new_template_values[key]


@pytest.mark.parametrize("via", VIA)
def test_api_templates_update_authenticated_owners(via, mock_user_teams):
    """Administrators of a template should be allowed to update it."""
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

    old_template_values = serializers.TemplateSerializer(instance=template).data

    new_template_values = serializers.TemplateSerializer(
        instance=factories.TemplateFactory()
    ).data

    response = client.put(
        f"/api/v1.0/templates/{template.id!s}/", new_template_values, format="json"
    )

    assert response.status_code == 200
    template.refresh_from_db()
    template_values = serializers.TemplateSerializer(instance=template).data
    for key, value in template_values.items():
        if key in ["id", "accesses"]:
            assert value == old_template_values[key]
        else:
            assert value == new_template_values[key]


@pytest.mark.parametrize("via", VIA)
def test_api_templates_update_administrator_or_owner_of_another(via, mock_user_teams):
    """
    Being administrator or owner of a template should not grant authorization to update
    another template.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory()
    if via == USER:
        factories.UserTemplateAccessFactory(
            template=template, user=user, role=random.choice(["administrator", "owner"])
        )
    elif via == TEAM:
        mock_user_teams.return_value = ["lasuite", "unknown"]
        factories.TeamTemplateAccessFactory(
            template=template,
            team="lasuite",
            role=random.choice(["administrator", "owner"]),
        )

    is_public = random.choice([True, False])
    template = factories.TemplateFactory(title="Old title", is_public=is_public)
    old_template_values = serializers.TemplateSerializer(instance=template).data

    new_template_values = serializers.TemplateSerializer(
        instance=factories.TemplateFactory()
    ).data
    response = client.put(
        f"/api/v1.0/templates/{template.id!s}/",
        new_template_values,
        format="json",
    )

    assert response.status_code == 403 if is_public else 404

    template.refresh_from_db()
    template_values = serializers.TemplateSerializer(instance=template).data
    assert template_values == old_template_values
