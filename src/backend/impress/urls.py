"""URL configuration for the impress project"""

import os
from django_prometheus import exports
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

from core.api.decorators import cidr_protected_view

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("core.urls")),
]

if os.environ.get("PROMETHEUS_METRICS", "False").lower() == "true":
    # Protect the Prometheus view with the CIDR decorator
    protected_export_view = cidr_protected_view(exports.ExportToDjangoView)
    urlpatterns.append(
        path("prometheus/", protected_export_view, name="prometheus-django-metrics"),
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
