"""Unit tests for the Authentication URLs."""

from core.authentication.urls import urlpatterns


def test_urls_override_default_mozilla_django_oidc():
    """Custom URL patterns should override default ones from Mozilla Django OIDC."""

    url_names = [u.name for u in urlpatterns]
    assert url_names.index("oidc_logout_custom") < url_names.index("oidc_logout")
