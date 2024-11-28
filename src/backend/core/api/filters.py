"""API filters for Impress' core application."""

from django.utils.translation import gettext_lazy as _

import django_filters

from core import models


class DocumentFilter(django_filters.FilterSet):
    """
    Custom filter for filtering documents.
    """

    is_creator_me = django_filters.BooleanFilter(
        method="filter_is_creator_me", label=_("Creator is me")
    )
    is_favorite = django_filters.BooleanFilter(
        method="filter_is_favorite", label=_("Favorite")
    )
    title = django_filters.CharFilter(
        field_name="title", lookup_expr="icontains", label=_("Title")
    )

    class Meta:
        model = models.Document
        fields = ["is_creator_me", "is_favorite", "link_reach", "title"]

    # pylint: disable=unused-argument
    def filter_is_creator_me(self, queryset, name, value):
        """
        Filter documents based on the `creator` being the current user.

        Example:
            - /api/v1.0/documents/?is_creator_me=true
                → Filters documents created by the logged-in user
            - /api/v1.0/documents/?is_creator_me=false
                → Filters documents created by other users
        """
        user = self.request.user

        if not user.is_authenticated:
            return queryset

        if value:
            return queryset.filter(creator=user)

        return queryset.exclude(creator=user)

    # pylint: disable=unused-argument
    def filter_is_favorite(self, queryset, name, value):
        """
        Filter documents based on whether they are marked as favorite by the current user.

        Example:
            - /api/v1.0/documents/?is_favorite=true
                → Filters documents marked as favorite by the logged-in user
            - /api/v1.0/documents/?is_favorite=false
                → Filters documents not marked as favorite by the logged-in user
        """
        user = self.request.user

        if not user.is_authenticated:
            return queryset

        if value:
            return queryset.filter(favorited_by_users__user=user)

        return queryset.exclude(favorited_by_users__user=user)
