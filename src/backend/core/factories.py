# ruff: noqa: S311
"""
Core application factories
"""
from django.conf import settings
from django.contrib.auth.hashers import make_password

import factory.fuzzy
from faker import Faker

from core import models

fake = Faker()


class UserFactory(factory.django.DjangoModelFactory):
    """A factory to random users for testing purposes."""

    class Meta:
        model = models.User

    language = factory.fuzzy.FuzzyChoice([lang[0] for lang in settings.LANGUAGES])
    password = make_password("password")


class IdentityFactory(factory.django.DjangoModelFactory):
    """A factory to create identities for a user"""

    class Meta:
        model = models.Identity
        django_get_or_create = ("sub",)

    user = factory.SubFactory(UserFactory)
    sub = factory.Sequence(lambda n: f"user{n!s}")
    email = factory.Faker("email")


class TeamFactory(factory.django.DjangoModelFactory):
    """A factory to create teams"""

    class Meta:
        model = models.Team
        django_get_or_create = ("name",)

    name = factory.Sequence(lambda n: f"team{n}")

    @factory.post_generation
    def users(self, create, extracted, **kwargs):
        """Add users to team from a given list of users with or without roles."""
        if create and extracted:
            for item in extracted:
                if isinstance(item, models.User):
                    TeamAccessFactory(team=self, user=item)
                else:
                    TeamAccessFactory(team=self, user=item[0], role=item[1])


class TeamAccessFactory(factory.django.DjangoModelFactory):
    """Create fake team user accesses for testing."""

    class Meta:
        model = models.TeamAccess

    team = factory.SubFactory(TeamFactory)
    user = factory.SubFactory(UserFactory)
    role = factory.fuzzy.FuzzyChoice([r[0] for r in models.RoleChoices.choices])
