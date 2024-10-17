"""Impress core API endpoints"""

from django.conf import settings
from django.core.exceptions import ValidationError

from rest_framework import exceptions as drf_exceptions
from rest_framework import views as drf_views
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import Document, User, RoleChoices, DocumentAccess


def exception_handler(exc, context):
    """Handle Django ValidationError as an accepted exception.

    For the parameters, see ``exception_handler``
    This code comes from twidi's gist:
    https://gist.github.com/twidi/9d55486c36b6a51bdcb05ce3a763e79f
    """
    if isinstance(exc, ValidationError):
        detail = exc.message_dict

        if hasattr(exc, "message"):
            detail = exc.message
        elif hasattr(exc, "messages"):
            detail = exc.messages

        exc = drf_exceptions.ValidationError(detail=detail)

    return drf_views.exception_handler(exc, context)


# pylint: disable=unused-argument
@api_view(["GET"])
def get_frontend_configuration(request):
    """Returns the frontend configuration dict as configured in settings."""
    frontend_configuration = {
        "LANGUAGE_CODE": settings.LANGUAGE_CODE,
    }
    frontend_configuration.update(settings.FRONTEND_CONFIGURATION)
    return Response(frontend_configuration)



@api_view(["POST"])
def create_summary(request):
    """Wip."""

    data = request.data

    document = Document(
        title="Votre résumé",
        link_reach="authenticated",
        link_role="reader",
    )

    document.save()
    owner_user = User.objects.get(email=data["owner"])

    document_access = DocumentAccess(
        user=owner_user,
        document=document,
        role=RoleChoices.OWNER
    )
    document_access.save()

    document.content = data["content"]
    document.save()

    return Response({"id": document.id})
