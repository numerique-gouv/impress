"""Custom authentication classes for the Impress core app"""

from django.conf import settings

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class ServerToServerAuthentication(BaseAuthentication):
    """
    Custom authentication class for server-to-server requests.
    Validates the presence and correctness of the Authorization header.
    """

    def authenticate(self, request):
        """
        Authenticate the server-to-server request by validating the Authorization header.

        This method checks if the Authorization header is present in the request, ensures it
        contains a valid token with the correct format, and verifies the token against the
        list of allowed server-to-server tokens. If the header is missing, improperly formatted,
        or contains an invalid token, an AuthenticationFailed exception is raised.

        Returns:
            None: If authentication is successful
                  (no user is authenticated for server-to-server requests).

        Raises:
            AuthenticationFailed: If the Authorization header is missing, malformed,
            or contains an invalid token.
        """
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            raise AuthenticationFailed("Authorization header is missing.")

        # Validate token format and existence
        prefix = "Bearer "
        if not auth_header.startswith(prefix):
            raise AuthenticationFailed("Invalid token format.")

        token = auth_header[len(prefix) :]
        if token not in settings.SERVER_TO_SERVER_API_TOKENS:
            raise AuthenticationFailed("Invalid server-to-server token.")

        # Authentication is successful, but no user is authenticated
