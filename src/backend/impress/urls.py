"""URL configuration for the impress project"""

import os
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.urls import include, path, re_path

from drf_spectacular.views import (
    SpectacularJSONAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from django_prometheus import exports
from core.api.custom_probe_views import liveness_check, readiness_check
from core.api.decorators import monitoring_cidr_protected_view

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("core.urls")),
]

# Conditionally add Prometheus Exporter endpoint
if os.environ.get("PROMETHEUS_EXPORTER", "False").lower() == "true":
    # Protect the Prometheus view with the CIDR decorator
    urlpatterns.append(
        path("prometheus/", monitoring_cidr_protected_view(exports.ExportToDjangoView), name="prometheus-django-metrics"),
    )

# Conditionally add liveness and readiness probe endpoints
if os.environ.get("K8S_PROBING", "False").lower() == "true":

    urlpatterns.append(
        path("probes/liveness/", monitoring_cidr_protected_view(liveness_check), name="liveness-probe"),
    )
    urlpatterns.append(
        path("probes/readiness/", monitoring_cidr_protected_view(readiness_check), name="readiness-probe"),
    )

if settings.DEBUG:
    urlpatterns = (
        urlpatterns
        + staticfiles_urlpatterns()
        + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    )


if settings.USE_SWAGGER or settings.DEBUG:
    urlpatterns += [
        path(
            f"{settings.API_VERSION}/swagger.json",
            SpectacularJSONAPIView.as_view(
                api_version=settings.API_VERSION,
                urlconf="core.urls",
            ),
            name="client-api-schema",
        ),
        path(
            f"{settings.API_VERSION}//swagger/",
            SpectacularSwaggerView.as_view(url_name="client-api-schema"),
            name="swagger-ui-schema",
        ),
        re_path(
            f"{settings.API_VERSION}//redoc/",
            SpectacularRedocView.as_view(url_name="client-api-schema"),
            name="redoc-schema",
        ),
    ]
