"""Collaboration services."""

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

import requests


class CollaborationService:
    """Service class for Collaboration related operations."""

    def __init__(self):
        """Ensure that the collaboration configuration is set properly."""
        if settings.COLLABORATION_API_URL is None:
            raise ImproperlyConfigured("Collaboration configuration not set")

    def reset_connections(self, room, user_id=None):
        """
        Reset connections of a room in the collaboration server.
        Reseting a connection means that the user will be disconnected and will
        have to reconnect to the collaboration server, with updated rights.
        """
        endpoint = "reset-connections"

        # room is necessary as a parameter, it is easier to stick to the
        # same pod thanks to a parameter
        endpoint_url = f"{settings.COLLABORATION_API_URL}{endpoint}/?room={room}"

        headers = {"Authorization": settings.COLLABORATION_SERVER_SECRET}
        if user_id:
            headers["X-User-Id"] = user_id

        try:
            response = requests.post(endpoint_url, headers=headers, timeout=10)
        except requests.RequestException as e:
            raise requests.HTTPError("Failed to notify WebSocket server.") from e

        if response.status_code != 200:
            raise requests.HTTPError(
                f"Failed to notify WebSocket server. Status code: {response.status_code}, "
                f"Response: {response.text}"
            )
