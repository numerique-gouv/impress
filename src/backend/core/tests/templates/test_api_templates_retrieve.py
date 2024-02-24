"""
Tests for Templates API endpoint in publish's core app: retrieve
"""
import pytest
from rest_framework.test import APIClient

from core import factories

pytestmark = pytest.mark.django_db


def test_api_templates_retrieve_anonymous_public():
    """Anonymous users should be allowed to retrieve public templates."""
    template = factories.TemplateFactory(is_public=True)

    response = APIClient().get(f"/api/v1.0/templates/{template.id!s}/")

    assert response.status_code == 200
    assert response.json() == {
        "id": str(template.id),
        "abilities": {
            "destroy": False,
            "generate_document": True,
            "manage_accesses": False,
            "retrieve": True,
            "update": False,
        },
        "accesses": [],
        "title": template.title,
    }


def test_api_templates_retrieve_anonymous_not_public():
    """Anonymous users should not be able to retrieve a template that is not public."""
    template = factories.TemplateFactory(is_public=False)

    response = APIClient().get(f"/api/v1.0/templates/{template.id!s}/")

    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}


def test_api_templates_retrieve_authenticated_unrelated_public():
    """
    Authenticated users should be able to retrieve a public template to which they are
    not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(is_public=True)

    response = client.get(
        f"/api/v1.0/templates/{template.id!s}/",
    )
    assert response.status_code == 200
    assert response.json() == {
        "id": str(template.id),
        "abilities": {
            "destroy": False,
            "generate_document": True,
            "manage_accesses": False,
            "retrieve": True,
            "update": False,
        },
        "accesses": [],
        "title": template.title,
    }


def test_api_templates_retrieve_authenticated_unrelated_not_public():
    """
    Authenticated users should not be allowed to retrieve a template that is not public and
    to which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(is_public=False)

    response = client.get(
        f"/api/v1.0/templates/{template.id!s}/",
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}


def test_api_templates_retrieve_authenticated_related():
    """
    Authenticated users should be allowed to retrieve a template to which they
    are related whatever the role.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory()
    access1 = factories.TemplateAccessFactory(template=template, user=user)
    access2 = factories.TemplateAccessFactory(template=template)

    response = client.get(
        f"/api/v1.0/templates/{template.id!s}/",
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
        "id": str(template.id),
        "title": template.title,
        "abilities": template.get_abilities(user),
    }
