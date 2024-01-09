"""Client serializers for the publish core app."""
from rest_framework import exceptions, serializers
from timezone_field.rest_framework import TimeZoneSerializerField

from core import models


class ContactSerializer(serializers.ModelSerializer):
    """Serialize contacts."""

    class Meta:
        model = models.Contact
        fields = [
            "id",
            "base",
            "data",
            "full_name",
            "owner",
            "short_name",
        ]
        read_only_fields = ["id", "owner"]

    def update(self, instance, validated_data):
        """Make "base" field readonly but only for update/patch."""
        validated_data.pop("base", None)
        return super().update(instance, validated_data)


class UserSerializer(serializers.ModelSerializer):
    """Serialize users."""

    timezone = TimeZoneSerializerField(use_pytz=False, required=True)

    class Meta:
        model = models.User
        fields = [
            "id",
            "language",
            "timezone",
            "is_device",
            "is_staff",
        ]
        read_only_fields = ["id", "is_device", "is_staff"]

class TeamAccessSerializer(serializers.ModelSerializer):
    """Serialize team accesses."""

    abilities = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = models.TeamAccess
        fields = ["id", "user", "role", "abilities"]
        read_only_fields = ["id", "abilities"]

    def update(self, instance, validated_data):
        """Make "user" field is readonly but only on update."""
        validated_data.pop("user", None)
        return super().update(instance, validated_data)

    def get_abilities(self, access) -> dict:
        """Return abilities of the logged-in user on the instance."""
        request = self.context.get("request")
        if request:
            return access.get_abilities(request.user)
        return {}

    def validate(self, attrs):
        """
        Check access rights specific to writing (create/update)
        """
        request = self.context.get("request")
        user = getattr(request, "user", None)
        role = attrs.get("role")

        # Update
        if self.instance:
            can_set_role_to = self.instance.get_abilities(user)["set_role_to"]

            if role and role not in can_set_role_to:
                message = (
                    f"You are only allowed to set role to {', '.join(can_set_role_to)}"
                    if can_set_role_to
                    else "You are not allowed to set this role for this team."
                )
                raise exceptions.PermissionDenied(message)

        # Create
        else:
            try:
                team_id = self.context["team_id"]
            except KeyError as exc:
                raise exceptions.ValidationError(
                    "You must set a team ID in kwargs to create a new team access."
                ) from exc

            if not models.TeamAccess.objects.filter(
                team=team_id,
                user=user,
                role__in=[models.RoleChoices.OWNER, models.RoleChoices.ADMIN],
            ).exists():
                raise exceptions.PermissionDenied(
                    "You are not allowed to manage accesses for this team."
                )

            if (
                role == models.RoleChoices.OWNER
                and not models.TeamAccess.objects.filter(
                    team=team_id,
                    user=user,
                    role=models.RoleChoices.OWNER,
                ).exists()
            ):
                raise exceptions.PermissionDenied(
                    "Only owners of a team can assign other users as owners."
                )

        attrs["team_id"] = self.context["team_id"]
        return attrs


class TeamSerializer(serializers.ModelSerializer):
    """Serialize teams."""

    abilities = serializers.SerializerMethodField(read_only=True)
    accesses = TeamAccessSerializer(many=True, read_only=True)

    class Meta:
        model = models.Team
        fields = ["id", "name", "accesses", "abilities"]
        read_only_fields = ["id", "accesses", "abilities"]

    def get_abilities(self, team) -> dict:
        """Return abilities of the logged-in user on the instance."""
        request = self.context.get("request")
        if request:
            return team.get_abilities(request.user)
        return {}
