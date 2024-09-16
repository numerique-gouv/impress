"""Client serializers for the impress core app."""

import mimetypes

from django.conf import settings
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

            if not self.Meta.model.objects.filter(  # pylint: disable=no-member
                Q(user=user) | Q(team__in=user.teams),
                role__in=[models.RoleChoices.OWNER, models.RoleChoices.ADMIN],
            ).exists():
                raise exceptions.PermissionDenied(
                    "You are not allowed to manage accesses for this resource."
                )

            if (
                role == models.RoleChoices.OWNER
                and not self.Meta.model.objects.filter(  # pylint: disable=no-member
                    Q(user=user) | Q(team__in=user.teams),
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
            "link_role",
            "link_reach",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "accesses",
            "abilities",
            "link_role",
            "link_reach",
            "created_at",
            "updated_at",
        ]

    def get_fields(self):
        """Dynamically make `id` read-only on PUT requests but writable on POST requests."""
        fields = super().get_fields()

        request = self.context.get("request")
        if request and request.method == "POST":
            fields["id"].read_only = False

        return fields

    def validate_id(self, value):
        """Ensure the provided ID does not already exist when creating a new document."""
        request = self.context.get("request")

        # Only check this on POST (creation)
        if request and request.method == "POST":
            if models.Document.objects.filter(id=value).exists():
                raise serializers.ValidationError(
                    "A document with this ID already exists. You cannot override it."
                )

        return value


class LinkDocumentSerializer(BaseResourceSerializer):
    """
    Serialize link configuration for documents.
    We expose it separately from document in order to simplify and secure access control.
    """

    class Meta:
        model = models.Document
        fields = [
            "link_role",
            "link_reach",
        ]


# Suppress the warning about not implementing `create` and `update` methods
# since we don't use a model and only rely on the serializer for validation
# pylint: disable=abstract-method
class FileUploadSerializer(serializers.Serializer):
    """Receive file upload requests."""

    file = serializers.FileField()

    def validate_file(self, file):
        """Add file size and type constraints as defined in settings."""
        # Validate file size
        if file.size > settings.DOCUMENT_IMAGE_MAX_SIZE:
            max_size = settings.DOCUMENT_IMAGE_MAX_SIZE // (1024 * 1024)
            raise serializers.ValidationError(
                f"File size exceeds the maximum limit of {max_size:d} MB."
            )

        # Validate file type
        mime_type, _ = mimetypes.guess_type(file.name)
        if mime_type not in settings.DOCUMENT_IMAGE_ALLOWED_MIME_TYPES:
            mime_types = ", ".join(settings.DOCUMENT_IMAGE_ALLOWED_MIME_TYPES)
            raise serializers.ValidationError(
                f"File type '{mime_type:s}' is not allowed. Allowed types are: {mime_types:s}"
            )

        return file


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

        if not models.DocumentAccess.objects.filter(
            Q(user=user) | Q(team__in=user.teams),
            document=document_id,
            role__in=[models.RoleChoices.OWNER, models.RoleChoices.ADMIN],
        ).exists():
            raise exceptions.PermissionDenied(
                "You are not allowed to manage invitations for this document."
            )

        if (
            role == models.RoleChoices.OWNER
            and not models.DocumentAccess.objects.filter(
                Q(user=user) | Q(team__in=user.teams),
                document=document_id,
                role=models.RoleChoices.OWNER,
            ).exists()
        ):
            raise exceptions.PermissionDenied(
                "Only owners of a document can invite other users as owners."
            )

        attrs["document_id"] = document_id
        attrs["issuer"] = user
        return attrs


class VersionFilterSerializer(serializers.Serializer):
    """Validate version filters applied to the list endpoint."""

    version_id = serializers.CharField(required=False, allow_blank=True)
    page_size = serializers.IntegerField(
        required=False, min_value=1, max_value=50, default=20
    )
