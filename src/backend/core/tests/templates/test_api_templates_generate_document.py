"""
Test users API endpoints in the impress core app.
"""
import pytest
from rest_framework.test import APIClient

from core import factories
from core.tests.conftest import TEAM, USER, VIA

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

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(is_public=True)
    data = {"body": "# Test markdown body"}

    response = client.post(
        f"/api/v1.0/templates/{template.id!s}/generate-document/",
        data,
        format="json",
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"


def test_api_templates_generate_document_authenticated_not_public():
    """
    Authenticated users should not be allowed to generate pdf document with templates
    that are not marked as public.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(is_public=False)
    data = {"body": "# Test markdown body"}

    response = client.post(
        f"/api/v1.0/templates/{template.id!s}/generate-document/",
        data,
        format="json",
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Not found."}


@pytest.mark.parametrize("via", VIA)
def test_api_templates_generate_document_related(via, mock_user_get_teams):
    """Users related to a template can generate pdf document."""
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    if via == USER:
        access = factories.UserTemplateAccessFactory(user=user)
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        access = factories.TeamTemplateAccessFactory(team="lasuite")

    data = {"body": "# Test markdown body"}

    response = client.post(
        f"/api/v1.0/templates/{access.template_id!s}/generate-document/",
        data,
        format="json",
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"


def test_api_templates_generate_document_type_html():
    """Generate pdf document with the body type html."""
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(is_public=True)
    data = {"body": "<p>Test body</p>", "body_type": "html"}

    response = client.post(
        f"/api/v1.0/templates/{template.id!s}/generate-document/",
        data,
        format="json",
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"


def test_api_templates_generate_document_type_markdown():
    """Generate pdf document with the body type markdown."""
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(is_public=True)
    data = {"body": "# Test markdown body", "body_type": "markdown"}

    response = client.post(
        f"/api/v1.0/templates/{template.id!s}/generate-document/",
        data,
        format="json",
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"


def test_api_templates_generate_document_type_unknown():
    """Generate pdf document with the body type unknown."""
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(is_public=True)
    data = {"body": "# Test markdown body", "body_type": "unknown"}

    response = client.post(
        f"/api/v1.0/templates/{template.id!s}/generate-document/",
        data,
        format="json",
    )

    assert response.status_code == 400
    assert response.json() == {
        "body_type": [
            '"unknown" is not a valid choice.',
        ]
    }


def test_api_templates_generate_document_export_docx():
    """Generate pdf document with the body type html."""
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(is_public=True)
    data = {"body": "<p>Test body</p>", "body_type": "html", "format": "docx"}

    response = client.post(
        f"/api/v1.0/templates/{template.id!s}/generate-document/",
        data,
        format="json",
    )

    assert response.status_code == 200
    assert (
        response.headers["content-type"]
        == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
