"""Unit tests for the Authentication Backends."""

import re

from django.core.exceptions import SuspiciousOperation
from django.test.utils import override_settings

import pytest
import responses

from core import models
from core.authentication.backends import OIDCAuthenticationBackend
from core.factories import UserFactory

pytestmark = pytest.mark.django_db


def test_authentication_getter_existing_user_no_email(
    django_assert_num_queries, monkeypatch
):
    """
    If an existing user matches the user's info sub, the user should be returned.
    """

    klass = OIDCAuthenticationBackend()
    db_user = UserFactory()

    def get_userinfo_mocked(*args):
        return {"sub": db_user.sub}

    monkeypatch.setattr(OIDCAuthenticationBackend, "get_userinfo", get_userinfo_mocked)

    with django_assert_num_queries(1):
        user = klass.get_or_create_user(
            access_token="test-token", id_token=None, payload=None
        )

    assert user == db_user


def test_authentication_getter_new_user_no_email(monkeypatch):
    """
    If no user matches the user's info sub, a user should be created.
    User's info doesn't contain an email, created user's email should be empty.
    """
    klass = OIDCAuthenticationBackend()

    def get_userinfo_mocked(*args):
        return {"sub": "123"}

    monkeypatch.setattr(OIDCAuthenticationBackend, "get_userinfo", get_userinfo_mocked)

    user = klass.get_or_create_user(
        access_token="test-token", id_token=None, payload=None
    )

    assert user.sub == "123"
    assert user.email is None
    assert user.password == "!"
    assert models.User.objects.count() == 1


def test_authentication_getter_new_user_with_email(monkeypatch):
    """
    If no user matches the user's info sub, a user should be created.
    User's email and name should be set on the identity.
    The "email" field on the User model should not be set as it is reserved for staff users.
    """
    klass = OIDCAuthenticationBackend()

    email = "impress@example.com"

    def get_userinfo_mocked(*args):
        return {"sub": "123", "email": email, "first_name": "John", "last_name": "Doe"}

    monkeypatch.setattr(OIDCAuthenticationBackend, "get_userinfo", get_userinfo_mocked)

    user = klass.get_or_create_user(
        access_token="test-token", id_token=None, payload=None
    )

    assert user.sub == "123"
    assert user.email == email
    assert user.password == "!"
    assert models.User.objects.count() == 1


def test_authentication_getter_invalid_token(django_assert_num_queries, monkeypatch):
    """The user's info doesn't contain a sub."""
    klass = OIDCAuthenticationBackend()

    def get_userinfo_mocked(*args):
        return {
            "test": "123",
        }

    monkeypatch.setattr(OIDCAuthenticationBackend, "get_userinfo", get_userinfo_mocked)

    with (
        django_assert_num_queries(0),
        pytest.raises(
            SuspiciousOperation,
            match="User info contained no recognizable user identification",
        ),
    ):
        klass.get_or_create_user(access_token="test-token", id_token=None, payload=None)

    assert models.User.objects.exists() is False


@override_settings(OIDC_OP_USER_ENDPOINT="http://oidc.endpoint.test/userinfo")
@responses.activate
def test_authentication_get_userinfo_json_response():
    """Test get_userinfo method with a JSON response."""

    responses.add(
        responses.GET,
        re.compile(r".*/userinfo"),
        json={"name": "John Doe", "email": "john.doe@example.com"},
        status=200,
    )

    oidc_backend = OIDCAuthenticationBackend()
    result = oidc_backend.get_userinfo("fake_access_token", None, None)

    assert result["name"] == "John Doe"
    assert result["email"] == "john.doe@example.com"


@override_settings(OIDC_OP_USER_ENDPOINT="http://oidc.endpoint.test/userinfo")
@responses.activate
def test_authentication_get_userinfo_token_response(monkeypatch):
    """Test get_userinfo method with a token response."""

    responses.add(
        responses.GET, re.compile(r".*/userinfo"), body="fake.jwt.token", status=200
    )

    def mock_verify_token(self, token):  # pylint: disable=unused-argument
        return {"name": "Jane Doe", "email": "jane.doe@example.com"}

    monkeypatch.setattr(OIDCAuthenticationBackend, "verify_token", mock_verify_token)

    oidc_backend = OIDCAuthenticationBackend()
    result = oidc_backend.get_userinfo("fake_access_token", None, None)

    assert result["name"] == "Jane Doe"
    assert result["email"] == "jane.doe@example.com"


@override_settings(OIDC_OP_USER_ENDPOINT="http://oidc.endpoint.test/userinfo")
@responses.activate
def test_authentication_get_userinfo_invalid_response():
    """
    Test get_userinfo method with an invalid JWT response that
    causes verify_token to raise an error.
    """

    responses.add(
        responses.GET, re.compile(r".*/userinfo"), body="fake.jwt.token", status=200
    )

    oidc_backend = OIDCAuthenticationBackend()

    with pytest.raises(
        SuspiciousOperation,
        match="Invalid response format or token verification failed",
    ):
        oidc_backend.get_userinfo("fake_access_token", None, None)
