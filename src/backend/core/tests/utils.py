"""Utils for tests in the publish core application"""
from rest_framework_simplejwt.tokens import AccessToken


class OIDCToken(AccessToken):
    """Set payload on token from user/contact/email"""

    @classmethod
    def for_user(cls, user):
        """Returns an authorization token for the given user for testing."""
        token = cls()
        token["sub"] = str(user.sub)
        token["email"] = user.email

        return token
