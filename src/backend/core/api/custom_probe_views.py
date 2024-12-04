import uuid
import requests
from django.http import JsonResponse, HttpResponseServerError, HttpResponse
from django.db import connections
from django.db.utils import OperationalError
from django.core.cache import cache
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

from impress import settings


def liveness_check(request):
    """
    Liveness probe endpoint.
    Returns HTTP 200 if the application is alive and running.
    """

    try:
        return JsonResponse({"status": "OK"}, status=200)
    except Exception as e:
        return JsonResponse({"status": "Error", "message": str(e)}, status=500)


def readiness_check(request):
    """
    Readiness probe endpoint.
    Checks database, cache, media storage, and OIDC configuration.
    Returns HTTP 200 with JSON status "OK" if all checks pass,
    or HTTP 500 with JSON status "Error" and an error message.
    """

    def check_database():
        """Check database connectivity."""
        try:
            db_conn = connections['default']
            db_conn.cursor()
        except OperationalError as e:
            raise Exception(f"Database check failed: {e}")

    def check_cache():
        """Check cache connectivity."""
        test_key = "readiness-probe"
        test_value = "ready"
        cache.set(test_key, test_value, timeout=5)
        if cache.get(test_key) != test_value:
            raise Exception("Cache check failed: Value mismatch or cache unavailable")

    def check_media_storage():
        """Check S3 storage connectivity."""
        test_file_name = f"readiness-check-{uuid.uuid4()}.txt"
        test_content = ContentFile(b"readiness check")
        try:
            # Attempt to save the test file
            default_storage.save(test_file_name, test_content)
            # Attempt to delete the test file
            default_storage.delete(test_file_name)
        except Exception as e:
            # Raise an exception if any error occurs during save or delete
            raise Exception(f"Media storage check failed: {e}")

    def check_oidc():
        """Check OIDC configuration and connectivity."""
        required_endpoints = [
            ("OIDC_OP_JWKS_ENDPOINT", settings.OIDC_OP_JWKS_ENDPOINT),
            ("OIDC_OP_TOKEN_ENDPOINT", settings.OIDC_OP_TOKEN_ENDPOINT),
            ("OIDC_OP_USER_ENDPOINT", settings.OIDC_OP_USER_ENDPOINT),
        ]

        missing_endpoints = [name for name, url in required_endpoints if not url]
        if missing_endpoints:
            raise Exception(f"Missing OIDC configuration for: {', '.join(missing_endpoints)}")

        for name, url in required_endpoints:
            try:
                requests.get(url, timeout=5)  # Just ensure the endpoint responds no matter the http status code
            except requests.RequestException as e:
                raise Exception(f"Failed to reach {name} ({url}): {e}")

    try:
        # Run all checks
        check_database()
        check_cache()
        check_media_storage()
        check_oidc()

        # If all checks pass
        return JsonResponse({"status": "OK"}, status=200)

    except Exception as e:
        # Return error response
        return JsonResponse({"status": "Error", "message": str(e)}, status=500)