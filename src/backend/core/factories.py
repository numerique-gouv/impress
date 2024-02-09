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

    sub = factory.Sequence(lambda n: f"user{n!s}")
    email = factory.Faker("email")
    language = factory.fuzzy.FuzzyChoice([lang[0] for lang in settings.LANGUAGES])
    password = make_password("password")


class TemplateFactory(factory.django.DjangoModelFactory):
    """A factory to create templates"""

    class Meta:
        model = models.Template
        django_get_or_create = ("title",)

    title = factory.Sequence(lambda n: f"template{n}")
    is_public = factory.Faker("boolean")

    @factory.post_generation
    def users(self, create, extracted, **kwargs):
        """Add users to template from a given list of users with or without roles."""
        if create and extracted:
            for item in extracted:
                if isinstance(item, models.User):
                    TemplateAccessFactory(template=self, user=item)
                else:
                    TemplateAccessFactory(template=self, user=item[0], role=item[1])


class TemplateAccessFactory(factory.django.DjangoModelFactory):
    """Create fake template user accesses for testing."""

    class Meta:
        model = models.TemplateAccess

    template = factory.SubFactory(TemplateFactory)
    user = factory.SubFactory(UserFactory)
    role = factory.fuzzy.FuzzyChoice([r[0] for r in models.RoleChoices.choices])
