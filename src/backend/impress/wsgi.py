"""
WSGI config for the impress project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.1/howto/deployment/wsgi/
"""

import os

from configurations.wsgi import get_wsgi_application

# Prometheus Metrics Registration
from prometheus_client import REGISTRY
from core.api.custom_metrics_collector import CustomMetricsCollector


def register_prometheus_metrics():
    """
    Register custom Prometheus metrics collector.
    """
    if not any(isinstance(cmc, CustomMetricsCollector) for cmc in REGISTRY._collector_to_names):
        REGISTRY.register(CustomMetricsCollector())
        print("Custom Prometheus metrics registered successfully.")
    else:
        print("Custom Prometheus metrics already registered.")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "impress.settings")
os.environ.setdefault("DJANGO_CONFIGURATION", "Development")

# Call register_prometheus_metrics to register Prometheus metrics if enabled
if os.environ.get("PROMETHEUS_METRICS", "False").lower() == "true":
    register_prometheus_metrics()

application = get_wsgi_application()
