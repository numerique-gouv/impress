"""Authentication for the publish core app."""
from django.conf import settings
from django.utils.functional import SimpleLazyObject
from django.utils.module_loading import import_string
from django.utils.translation import gettext_lazy as _

from drf_spectacular.authentication import SessionScheme, TokenScheme
from drf_spectacular.plumbing import build_bearer_security_scheme_object
from rest_framework import authentication
from rest_framework_simplejwt.authentication import JWTAuthentication


class DelegatedJWTAuthentication(JWTAuthentication):
    """Override JWTAuthentication to create missing users on the fly."""

    def get_user(self, validated_token):
        """
        Return the user related to the given validated token, creating or updating it if necessary.
        """
        get_user = import_string(settings.JWT_USER_GETTER)
        return SimpleLazyObject(lambda: get_user(validated_token))


class OpenApiJWTAuthenticationExtension(TokenScheme):
    """Extension for specifying JWT authentication schemes."""

    target_class = "core.authentication.DelegatedJWTAuthentication"
    name = "DelegatedJWTAuthentication"

    def get_security_definition(self, auto_schema):
        """Return the security definition for JWT authentication."""
        return build_bearer_security_scheme_object(
            header_name="Authorization",
            token_prefix="Bearer",  # noqa S106
        )


class SessionAuthenticationWithAuthenticateHeader(authentication.SessionAuthentication):
    """
    This class is needed, because REST Framework's default SessionAuthentication does
    never return 401's, because they cannot fill the WWW-Authenticate header with a
    valid value in the 401 response. As a result, we cannot distinguish calls that are
    not unauthorized (401 unauthorized) and calls for which the user does not have
    permission (403 forbidden).
    See https://github.com/encode/django-rest-framework/issues/5968

    We do set authenticate_header function in SessionAuthentication, so that a value
    for the WWW-Authenticate header can be retrieved and the response code is
    automatically set to 401 in case of unauthenticated requests.
    """

    def authenticate_header(self, request):
        return "Session"


class OpenApiSessionAuthenticationExtension(SessionScheme):
    """Extension for specifying session authentication schemes."""

    target_class = "core.api.authentication.SessionAuthenticationWithAuthenticateHeader"
