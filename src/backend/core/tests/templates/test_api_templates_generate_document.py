"""
Test users API endpoints in the publish core app.
"""
import pytest
from rest_framework.test import APIClient

from core import factories
from core.tests.utils import OIDCToken

pytestmark = pytest.mark.django_db


def test_api_templates_generate_document_anonymous_public():
    """Anonymous users can generate pdf document with public templates."""
    template = factories.TemplateFactory(is_public=True)
    data = {
        "body": "# Test markdown body",
    }

    response = APIClient().post(
        f"/api/v1.0/templates/{template.id!s}/generate-document/",
        data,
        format="json",
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"


def test_api_templates_generate_document_anonymous_not_public():
    """
    Anonymous users should not be allowed to generate pdf document with templates
    that are not marked as public.
    """
    template = factories.TemplateFactory(is_public=False)
    data = {
        "body": "# Test markdown body",
    }

    response = APIClient().post(
        f"/api/v1.0/templates/{template.id!s}/generate-document/",
        data,
        format="json",
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}


def test_api_templates_generate_document_authenticated_public():
    """Authenticated users can generate pdf document with public templates."""
    user = factories.UserFactory()
    jwt_token = OIDCToken.for_user(user)

    template = factories.TemplateFactory(is_public=True)
    data = {"body": "# Test markdown body"}

    response = APIClient().post(
        f"/api/v1.0/templates/{template.id!s}/generate-document/",
        data,
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"


def test_api_templates_generate_document_authenticated_not_public():
    """
    Authenticated users should not be allowed to generate pdf document with templates
    that are not marked as public.
    """
    user = factories.UserFactory()
    jwt_token = OIDCToken.for_user(user)

    template = factories.TemplateFactory(is_public=False)
    data = {"body": "# Test markdown body"}

    response = APIClient().post(
        f"/api/v1.0/templates/{template.id!s}/generate-document/",
        data,
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}


def test_api_templates_generate_document_related():
    """Users related to a template can generate pdf document."""
    user = factories.UserFactory()
    jwt_token = OIDCToken.for_user(user)

    access = factories.TemplateAccessFactory(user=user)
    data = {"body": "# Test markdown body"}

    response = APIClient().post(
        f"/api/v1.0/templates/{access.template.id!s}/generate-document/",
        data,
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
