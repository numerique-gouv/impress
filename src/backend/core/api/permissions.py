"""Permission handlers for the impress core app."""

from django.core import exceptions
from django.db.models import Q

from rest_framework import permissions

from core.models import DocumentAccess, RoleChoices

ACTION_FOR_METHOD_TO_PERMISSION = {
    "versions_detail": {"DELETE": "versions_destroy", "GET": "versions_retrieve"}
}


class IsAuthenticated(permissions.BasePermission):
    """
    Allows access only to authenticated users. Alternative method checking the presence
    of the auth token to avoid hitting the database.
    """

    def has_permission(self, request, view):
        return bool(request.auth) or request.user.is_authenticated


class IsAuthenticatedOrSafe(IsAuthenticated):
    """Allows access to authenticated users (or anonymous users but only on safe methods)."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return super().has_permission(request, view)


class IsSelf(IsAuthenticated):
    """
    Allows access only to authenticated users. Alternative method checking the presence
    of the auth token to avoid hitting the database.
    """

    def has_object_permission(self, request, view, obj):
        """Write permissions are only allowed to the user itself."""
        return obj == request.user


class IsOwnedOrPublic(IsAuthenticated):
    """
    Allows access to authenticated users only for objects that are owned or not related
    to any user via the "owner" field.
    """

    def has_object_permission(self, request, view, obj):
        """Unsafe permissions are only allowed for the owner of the object."""
        if obj.owner == request.user:
            return True

        if request.method in permissions.SAFE_METHODS and obj.owner is None:
            return True

        try:
            return obj.user == request.user
        except exceptions.ObjectDoesNotExist:
            return False


class CanCreateInvitationPermission(permissions.BasePermission):
    """
    Custom permission class to handle permission checks for managing invitations.
    """

    def has_permission(self, request, view):
        user = request.user

        # Ensure the user is authenticated
        if not (bool(request.auth) or request.user.is_authenticated):
            return False

        # Apply permission checks only for creation (POST requests)
        if view.action != "create":
            return True

        # Check if resource_id is passed in the context
        try:
            document_id = view.kwargs["resource_id"]
        except KeyError as exc:
            raise exceptions.ValidationError(
                "You must set a document ID in kwargs to manage document invitations."
            ) from exc

        # Check if the user has access to manage invitations (Owner/Admin roles)
        return DocumentAccess.objects.filter(
            Q(user=user) | Q(team__in=user.teams),
            document=document_id,
            role__in=[RoleChoices.OWNER, RoleChoices.ADMIN],
        ).exists()


class AccessPermission(permissions.BasePermission):
    """Permission class for access objects."""

    def has_permission(self, request, view):
        return request.user.is_authenticated or view.action != "create"

    def has_object_permission(self, request, view, obj):
        """Check permission for a given object."""
        abilities = obj.get_abilities(request.user)
        action = view.action
        try:
            action = ACTION_FOR_METHOD_TO_PERMISSION[view.action][request.method]
        except KeyError:
            pass
        return abilities.get(action, False)
