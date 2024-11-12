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

    class Meta:
        model = models.Document
        fields = ["is_creator_me"]

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
            - /api/v1.0/documents/?favorite=true
                → Filters documents marked as favorite by the logged-in user
            - /api/v1.0/documents/?favorite=false
                → Filters documents not marked as favorite by the logged-in user
        """
        user = self.request.user

        if not user.is_authenticated:
            return queryset

        clause = "filter" if value else "exclude"
        return getattr(queryset, clause)(
            favorited_by_users__user=user, favorited_by_users__is_favorite=True
        )
