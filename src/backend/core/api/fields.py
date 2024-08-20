"""A JSONField for DRF to handle serialization/deserialization."""

import json

from rest_framework import serializers


class JSONField(serializers.Field):
    """
    A custom field for handling JSON data.
    """

    def to_representation(self, value):
        """
        Convert the JSON string to a Python dictionary for serialization.
        """
        return value

    def to_internal_value(self, data):
        """
        Convert the Python dictionary to a JSON string for deserialization.
        """
        if data is None:
            return None
        return json.dumps(data)
