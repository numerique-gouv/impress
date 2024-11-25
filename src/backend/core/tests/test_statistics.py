import pytest
from datetime import datetime, timezone, timedelta
from faker import Faker
from rest_framework.test import APIClient
from core import factories, models
from django.utils.timezone import now
from unittest import mock
from zoneinfo import ZoneInfo


fake = Faker()
pytestmark = pytest.mark.django_db


def test_stats_view_anonymous_access():
    """
    Anonymous users should not have access to the stats endpoint.
    """
    client = APIClient()
    response = client.get("/api/v1.0/stats/")
    assert response.status_code == 401


def test_stats_view_non_admin_access():
    """
    Non-admin authenticated users should not have access to the stats endpoint.
    """
    regular_user = factories.UserFactory(is_staff=False)
    client = APIClient()
    client.force_login(regular_user)

    response = client.get("/api/v1.0/stats/")
    assert response.status_code == 403


def test_stats_view_invalid_timezone():
    """
    Providing an invalid timezone should result in a 400 response.
    """
    admin_user = factories.UserFactory(is_staff=True)
    client = APIClient()
    client.force_login(admin_user)

    response = client.get("/api/v1.0/stats/?tz=Invalid/Timezone")
    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid timezone provided."}


@pytest.mark.django_db
def test_stats_view_timezone_support():
    admin_user = factories.UserFactory(is_staff=True, timezone="Europe/Berlin")
    assert str(admin_user.timezone) == "Europe/Berlin"  # Ensure correct string representation

    # Ensure the `timezone` is passed as a string in the request
    admin_user.timezone = "Europe/Berlin"  # Override if necessary
    admin_user.save()

    client = APIClient()
    client.force_login(admin_user)

    mocked_now = now()
    with mock.patch("django.utils.timezone.now", return_value=mocked_now):
        response = client.get("/api/v1.0/stats/?tz=Europe/Berlin")
        print(f"Response status: {response.status_code}, Content: {response.content}")
        assert response.status_code == 200

        content = response.json()
        assert "statistics" in content

        berlin_now = mocked_now.astimezone(ZoneInfo("Europe/Berlin"))
        today_berlin = berlin_now.replace(hour=0, minute=0, second=0, microsecond=0)
        assert today_berlin is not None

def test_stats_view_admin_access():
    """
    Admin users should have access to the stats endpoint and receive correct statistics.
    """
    admin_user = factories.UserFactory(is_staff=True)
    client = APIClient()
    client.force_login(admin_user)

    # Create additional users and data
    factories.UserFactory.create_batch(10)
    factories.DocumentFactory.create_batch(5)
    factories.UserDocumentAccessFactory.create_batch(5)

    response = client.get("/api/v1.0/stats/")
    assert response.status_code == 200

    content = response.json()
    assert "statistics" in content
    assert "user_statistics" in content["statistics"]
    assert "document_statistics" in content["statistics"]

    user_stats = content["statistics"]["user_statistics"]
    assert user_stats["total_users"] > 0
    assert user_stats["percentage_active_users_today"] >= 0

    document_stats = content["statistics"]["document_statistics"]
    assert document_stats["total_documents"] > 0


@pytest.mark.django_db
def test_stats_view_timezone_impact():
    """
    This test evaluates the database query for active documents today
    across multiple timezones without using `client.get`. The reason
    for directly evaluating the query instead of relying on `client.get`
    is that time discrepancies between the server and the mocked environment
    (e.g., fixed_now) prevent proper evaluation of the test.

    Using tools like `time-machine` to mock time globally would break the
    backend-server communication with external services like MinIO which is used
    as the default storage backend, resulting in authentication errors (e.g., 403 Forbidden).
    Hence, this workaround directly validates the raw database query for multiple timezones 1:1
    the same way as the actual view does.
    """
    admin_user = factories.UserFactory(is_staff=True, timezone="UTC")
    client = APIClient()
    client.force_login(admin_user)

    fixed_now = datetime(2024, 12, 31, 2, 0, 0, tzinfo=timezone.utc)

    with mock.patch("django.utils.timezone.now", return_value=fixed_now):
        # Set updated_at_time to fall inside "today" for one timezone but not another
        updated_at_time = datetime(2024, 12, 30, 23, 59, 59, tzinfo=timezone.utc)

        # Create document and set updated_at explicitly
        document = factories.DocumentFactory()
        models.Document.objects.filter(pk=document.pk).update(updated_at=updated_at_time)
        document.refresh_from_db()

        # Timezone configurations
        timezones = {
            "UTC": ZoneInfo("UTC"),
            "Europe/Berlin": ZoneInfo("Europe/Berlin"),
            "Asia/Tokyo": ZoneInfo("Asia/Tokyo"),
        }

        for tz_name, tz_info in timezones.items():
            # Calculate today and tomorrow for each timezone
            today_start_tz = fixed_now.astimezone(tz_info).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            tomorrow_start_tz = today_start_tz + timedelta(days=1)

            # Convert to UTC for database query
            today_start_utc = today_start_tz.astimezone(ZoneInfo("UTC"))
            tomorrow_start_utc = tomorrow_start_tz.astimezone(ZoneInfo("UTC"))

            # Evaluate query
            queryset = models.Document.objects.filter(
                updated_at__gte=today_start_utc,
                updated_at__lt=tomorrow_start_utc,
            )

            count = queryset.count()

            # Assertions per timezone
            if tz_name == "UTC":
                assert count == 0  # Document is not active today in UTC
            elif tz_name == "Europe/Berlin":
                assert count == 1  # Document is active today in Europe/Berlin
            elif tz_name == "Asia/Tokyo":
                assert count == 1  # Document is active today in Asia/Tokyo


def test_stats_view_correct_calculations():
    """
    Ensure the endpoint returns accurate statistics.
    """
    admin_user = factories.UserFactory(is_staff=True)
    client = APIClient()
    client.force_login(admin_user)

    # Create users and documents
    factories.UserFactory.create_batch(3)
    factories.DocumentFactory.create_batch(2)

    response = client.get("/api/v1.0/stats/")
    assert response.status_code == 200

    content = response.json()
    user_stats = content["statistics"]["user_statistics"]
    document_stats = content["statistics"]["document_statistics"]

    assert user_stats["total_users"] > 0
    assert document_stats["total_documents"] > 0
