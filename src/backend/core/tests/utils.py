"""Utils for tests in the publish core application"""
from rest_framework_simplejwt.tokens import AccessToken


class OIDCToken(AccessToken):
    """Set payload on token from user/contact/email"""

    @classmethod
    def for_user(cls, user):
        token = super().for_user(user)
        identity = user.identities.filter(is_main=True).first()
        token["first_name"] = (
            user.profile_contact.short_name if user.profile_contact else "David"
        )
        token["last_name"] = (
            " ".join(user.profile_contact.full_name.split()[1:])
            if user.profile_contact
            else "Bowman"
        )
        token["email"] = identity.email
        return token
