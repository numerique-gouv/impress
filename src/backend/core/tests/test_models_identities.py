"""
Unit tests for the Identity model
"""
from django.core.exceptions import ValidationError

import pytest

from core import factories, models

pytestmark = pytest.mark.django_db


def test_models_identities_str_main():
    """The str representation should be the email address with indication that it is main."""
    identity = factories.IdentityFactory(email="david@example.com")
    assert str(identity) == "david@example.com[main]"


def test_models_identities_str_secondary():
    """The str representation of a secondary email should be the email address."""
    main_identity = factories.IdentityFactory()
    secondary_identity = factories.IdentityFactory(
        user=main_identity.user, email="david@example.com"
    )
    assert str(secondary_identity) == "david@example.com"


def test_models_identities_is_main_automatic():
    """The first identity created for a user should automatically be set as main."""
    user = factories.UserFactory()
    identity = models.Identity.objects.create(
        user=user, sub="123", email="david@example.com"
    )
    assert identity.is_main is True


def test_models_identities_is_main_exists():
    """A user should always keep one and only one of its identities as main."""
    user = factories.UserFactory()
    main_identity, _secondary_identity = factories.IdentityFactory.create_batch(
        2, user=user
    )

    assert main_identity.is_main is True

    main_identity.is_main = False
    with pytest.raises(
        ValidationError, match="A user should have one and only one main identity."
    ):
        main_identity.save()


def test_models_identities_is_main_switch():
    """Setting a secondary identity as main should reset the existing main identity."""
    user = factories.UserFactory()
    first_identity, second_identity = factories.IdentityFactory.create_batch(
        2, user=user
    )

    assert first_identity.is_main is True

    second_identity.is_main = True
    second_identity.save()

    second_identity.refresh_from_db()
    assert second_identity.is_main is True

    first_identity.refresh_from_db()
    assert first_identity.is_main is False


def test_models_identities_email_required():
    """The "email" field is required."""
    user = factories.UserFactory()
    with pytest.raises(ValidationError, match="This field cannot be null."):
        models.Identity.objects.create(user=user, email=None)


def test_models_identities_user_required():
    """The "user" field is required."""
    with pytest.raises(models.User.DoesNotExist, match="Identity has no user."):
        models.Identity.objects.create(user=None, email="david@example.com")


def test_models_identities_email_unique_same_user():
    """The "email" field should be unique for a given user."""
    email = factories.IdentityFactory()

    with pytest.raises(
        ValidationError,
        match="Identity with this User and Email address already exists.",
    ):
        factories.IdentityFactory(user=email.user, email=email.email)


def test_models_identities_email_unique_different_users():
    """The "email" field should not be unique among users."""
    email = factories.IdentityFactory()
    factories.IdentityFactory(email=email.email)


def test_models_identities_email_normalization():
    """The email field should be automatically normalized upon saving."""
    email = factories.IdentityFactory()
    email.email = "Thomas.Jefferson@Example.com"
    email.save()
    assert email.email == "Thomas.Jefferson@example.com"


def test_models_identities_ordering():
    """Identitys should be returned ordered by main status then by their email address."""
    user = factories.UserFactory()
    factories.IdentityFactory.create_batch(5, user=user)

    emails = models.Identity.objects.all()

    assert emails[0].is_main is True
    for i in range(3):
        assert emails[i + 1].is_main is False
        assert emails[i + 2].email >= emails[i + 1].email


def test_models_identities_sub_null():
    """The "sub" field should not be null."""
    user = factories.UserFactory()
    with pytest.raises(ValidationError, match="This field cannot be null."):
        models.Identity.objects.create(user=user, sub=None)


def test_models_identities_sub_blank():
    """The "sub" field should not be blank."""
    user = factories.UserFactory()
    with pytest.raises(ValidationError, match="This field cannot be blank."):
        models.Identity.objects.create(user=user, email="david@example.com", sub="")


def test_models_identities_sub_unique():
    """The "sub" field should be unique."""
    user = factories.UserFactory()
    identity = factories.IdentityFactory()
    with pytest.raises(ValidationError, match="Identity with this Sub already exists."):
        models.Identity.objects.create(user=user, sub=identity.sub)


def test_models_identities_sub_max_length():
    """The sub field should be 255 characters maximum."""
    factories.IdentityFactory(sub="a" * 255)
    with pytest.raises(ValidationError) as excinfo:
        factories.IdentityFactory(sub="a" * 256)

    assert (
        str(excinfo.value)
        == "{'sub': ['Ensure this value has at most 255 characters (it has 256).']}"
    )


def test_models_identities_sub_special_characters():
    """The sub field should accept periods, dashes, +, @ and underscores."""
    identity = factories.IdentityFactory(sub="dave.bowman-1+2@hal_9000")
    assert identity.sub == "dave.bowman-1+2@hal_9000"


def test_models_identities_sub_spaces():
    """The sub field should not accept spaces."""
    with pytest.raises(ValidationError) as excinfo:
        factories.IdentityFactory(sub="a b")

    assert str(excinfo.value) == (
        "{'sub': ['Enter a valid sub. This value may contain only letters, numbers, "
        "and @/./+/-/_ characters.']}"
    )


def test_models_identities_sub_upper_case():
    """The sub field should accept upper case characters."""
    identity = factories.IdentityFactory(sub="John")
    assert identity.sub == "John"


def test_models_identities_sub_ascii():
    """The sub field should accept non ASCII letters."""
    identity = factories.IdentityFactory(sub="rené")
    assert identity.sub == "rené"
