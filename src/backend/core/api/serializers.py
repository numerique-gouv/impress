"""Client serializers for the impress core app."""
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from rest_framework import exceptions, serializers

from core import models


class UserSerializer(serializers.ModelSerializer):
    """Serialize users."""

    class Meta:
        model = models.User
        fields = ["id", "email"]
        read_only_fields = ["id", "email"]


class BaseAccessSerializer(serializers.ModelSerializer):
    """Serialize template accesses."""

    abilities = serializers.SerializerMethodField(read_only=True)

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
                    else "You are not allowed to set this role for this template."
                )
                raise exceptions.PermissionDenied(message)

        # Create
        else:
            try:
                resource_id = self.context["resource_id"]
            except KeyError as exc:
                raise exceptions.ValidationError(
                    "You must set a resource ID in kwargs to create a new access."
                ) from exc

            teams = user.get_teams()
            if not self.Meta.model.objects.filter(  # pylint: disable=no-member
                Q(user=user) | Q(team__in=teams),
                role__in=[models.RoleChoices.OWNER, models.RoleChoices.ADMIN],
            ).exists():
                raise exceptions.PermissionDenied(
                    "You are not allowed to manage accesses for this resource."
                )

            if (
                role == models.RoleChoices.OWNER
                and not self.Meta.model.objects.filter(  # pylint: disable=no-member
                    Q(user=user) | Q(team__in=teams),
                    role=models.RoleChoices.OWNER,
                    **{self.Meta.resource_field_name: resource_id},  # pylint: disable=no-member
                ).exists()
            ):
                raise exceptions.PermissionDenied(
                    "Only owners of a resource can assign other users as owners."
                )

        # pylint: disable=no-member
        attrs[f"{self.Meta.resource_field_name}_id"] = self.context["resource_id"]
        return attrs


class DocumentAccessSerializer(BaseAccessSerializer):
    """Serialize document accesses."""

    user_id = serializers.PrimaryKeyRelatedField(
        queryset=models.User.objects.all(),
        write_only=True,
        source="user",
        required=False,
        allow_null=True,
    )
    user = UserSerializer(read_only=True)

    class Meta:
        model = models.DocumentAccess
        resource_field_name = "document"
        fields = ["id", "user", "user_id", "team", "role", "abilities"]
        read_only_fields = ["id", "abilities"]


class TemplateAccessSerializer(BaseAccessSerializer):
    """Serialize template accesses."""

    class Meta:
        model = models.TemplateAccess
        resource_field_name = "template"
        fields = ["id", "user", "team", "role", "abilities"]
        read_only_fields = ["id", "abilities"]


class BaseResourceSerializer(serializers.ModelSerializer):
    """Serialize documents."""

    abilities = serializers.SerializerMethodField(read_only=True)
    accesses = TemplateAccessSerializer(many=True, read_only=True)

    def get_abilities(self, document) -> dict:
        """Return abilities of the logged-in user on the instance."""
        request = self.context.get("request")
        if request:
            return document.get_abilities(request.user)
        return {}


class DocumentSerializer(BaseResourceSerializer):
    """Serialize documents."""

    content = serializers.CharField(required=False)
    accesses = DocumentAccessSerializer(many=True, read_only=True)

    class Meta:
        model = models.Document
        fields = [
            "id",
            "content",
            "title",
            "accesses",
            "abilities",
            "is_public",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "accesses", "abilities", "created_at", "updated_at"]


class TemplateSerializer(BaseResourceSerializer):
    """Serialize templates."""

    class Meta:
        model = models.Template
        fields = [
            "id",
            "title",
            "accesses",
            "abilities",
            "css",
            "code",
            "is_public",
        ]
        read_only_fields = ["id", "accesses", "abilities"]


# pylint: disable=abstract-method
class DocumentGenerationSerializer(serializers.Serializer):
    """Serializer to receive a request to generate a document on a template."""

    body = serializers.CharField(label=_("Body"))
    body_type = serializers.ChoiceField(
        choices=["html", "markdown"],
        label=_("Body type"),
        required=False,
        default="html",
    )
    format = serializers.ChoiceField(
        choices=["pdf", "docx"],
        label=_("Format"),
        required=False,
        default="pdf",
    )


class InvitationSerializer(serializers.ModelSerializer):
    """Serialize invitations."""

    abilities = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = models.Invitation
        fields = [
            "id",
            "abilities",
            "created_at",
            "email",
            "document",
            "role",
            "issuer",
            "is_expired",
        ]
        read_only_fields = [
            "id",
            "abilities",
            "created_at",
            "document",
            "issuer",
            "is_expired",
        ]

    def get_abilities(self, invitation) -> dict:
        """Return abilities of the logged-in user on the instance."""
        request = self.context.get("request")
        if request:
            return invitation.get_abilities(request.user)
        return {}

    def validate(self, attrs):
        """Validate and restrict invitation to new user based on email."""

        request = self.context.get("request")
        user = getattr(request, "user", None)
        role = attrs.get("role")

        try:
            document_id = self.context["resource_id"]
        except KeyError as exc:
            raise exceptions.ValidationError(
                "You must set a document ID in kwargs to create a new document invitation."
            ) from exc

        if not user and user.is_authenticated:
            raise exceptions.PermissionDenied(
                "Anonymous users are not allowed to create invitations."
            )

        teams = user.get_teams()
        if not models.DocumentAccess.objects.filter(
            Q(user=user) | Q(team__in=teams),
            document=document_id,
            role__in=[models.RoleChoices.OWNER, models.RoleChoices.ADMIN],
        ).exists():
            raise exceptions.PermissionDenied(
                "You are not allowed to manage invitations for this document."
            )

        if (
            role == models.RoleChoices.OWNER
            and not models.DocumentAccess.objects.filter(
                Q(user=user) | Q(team__in=teams),
                document=document_id,
                role=models.RoleChoices.OWNER,
            ).exists()
        ):
            raise exceptions.PermissionDenied(
                "Only owners of a document can invite other users as owners."
            )

        user.language = request.headers.get("Content-Language", "en")
        attrs["document_id"] = document_id
        attrs["issuer"] = user
        return attrs


class DocumentVersionSerializer(serializers.Serializer):
    """Serialize Versions."""

    etag = serializers.CharField()
    is_latest = serializers.BooleanField()
    last_modified = serializers.DateTimeField()
    version_id = serializers.CharField()
