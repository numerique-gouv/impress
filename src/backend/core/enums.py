"""
Core application enums declaration
"""
from django.conf import global_settings, settings
from django.utils.translation import gettext_lazy as _

# Django sets `LANGUAGES` by default with all supported languages. We can use it for
# the choice of languages which should not be limited to the few languages active in
# the app.
# pylint: disable=no-member
ALL_LANGUAGES = getattr(
    settings,
    "ALL_LANGUAGES",
    [(language, _(name)) for language, name in global_settings.LANGUAGES],
)
