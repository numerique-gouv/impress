"""
Utils that can be useful throughout the publish core app
"""
from rest_framework_simplejwt.tokens import RefreshToken


def get_tokens_for_user(user):
    """Get JWT tokens for user authentication."""
    refresh = RefreshToken.for_user(user)

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }
