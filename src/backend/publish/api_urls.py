"""API URL Configuration"""
from django.conf import settings
from django.urls import include, path, re_path

from rest_framework.routers import DefaultRouter

from core.api import viewsets

# - Main endpoints
router = DefaultRouter()
router.register("contacts", viewsets.ContactViewSet, basename="contacts")
router.register("teams", viewsets.TeamViewSet, basename="teams")
router.register("users", viewsets.UserViewSet, basename="users")

# - Routes nested under a team
team_related_router = DefaultRouter()
team_related_router.register(
    "accesses",
    viewsets.TeamAccessViewSet,
    basename="team_accesses",
)

urlpatterns = [
    path(
        f"api/{settings.API_VERSION}/",
        include(
            [
                *router.urls,
                re_path(
                    r"^teams/(?P<team_id>[0-9a-z-]*)/",
                    include(team_related_router.urls),
                ),
            ]
        ),
    )
]
