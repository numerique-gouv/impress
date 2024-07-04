"""Test the `create_demo` management command"""

from django.core.management import call_command
from django.test import override_settings

import pytest

from core import models

pytestmark = pytest.mark.django_db


@override_settings(DEBUG=True)
def test_commands_create_demo():
    """The create_demo management command should create objects as expected."""
    call_command("create_demo")

    assert models.Template.objects.count() == 1
    assert models.User.objects.count() >= 50
    assert models.Document.objects.count() >= 50
    assert models.DocumentAccess.objects.count() > 50
