"""API endpoints"""
import json
from io import BytesIO

from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import (
    OuterRef,
    Q,
    Subquery,
)
from django.http import FileResponse, Http404

from botocore.exceptions import ClientError
from rest_framework import (
    decorators,
    exceptions,
    filters,
    mixins,
    pagination,
    status,
    viewsets,
)
from rest_framework import (
    response as drf_response,
)

from core import models

from . import permissions, serializers

# pylint: disable=too-many-ancestors


class NestedGenericViewSet(viewsets.GenericViewSet):
    """
    A generic Viewset aims to be used in a nested route context.
    e.g: `/api/v1.0/resource_1/<resource_1_pk>/resource_2/<resource_2_pk>/`

    It allows to define all url kwargs and lookup fields to perform the lookup.
    """

    lookup_fields: list[str] = ["pk"]
    lookup_url_kwargs: list[str] = []

    def __getattribute__(self, item):
        """
        This method is overridden to allow to get the last lookup field or lookup url kwarg
        when accessing the `lookup_field` or `lookup_url_kwarg` attribute. This is useful
        to keep compatibility with all methods used by the parent class `GenericViewSet`.
        """
        if item in ["lookup_field", "lookup_url_kwarg"]:
            return getattr(self, item + "s", [None])[-1]

        return super().__getattribute__(item)

    def get_queryset(self):
        """
        Get the list of items for this view.

        `lookup_fields` attribute is enumerated here to perform the nested lookup.
        """
        queryset = super().get_queryset()

        # The last lookup field is removed to perform the nested lookup as it corresponds
        # to the object pk, it is used within get_object method.
        lookup_url_kwargs = (
            self.lookup_url_kwargs[:-1]
            if self.lookup_url_kwargs
            else self.lookup_fields[:-1]
        )

        filter_kwargs = {}
        for index, lookup_url_kwarg in enumerate(lookup_url_kwargs):
            if lookup_url_kwarg not in self.kwargs:
                raise KeyError(
                    f"Expected view {self.__class__.__name__} to be called with a URL "
                    f'keyword argument named "{lookup_url_kwarg}". Fix your URL conf, or '
                    "set the `.lookup_fields` attribute on the view correctly."
                )

            filter_kwargs.update(
                {self.lookup_fields[index]: self.kwargs[lookup_url_kwarg]}
            )

        return queryset.filter(**filter_kwargs)


class SerializerPerActionMixin:
    """
    A mixin to allow to define serializer classes for each action.

    This mixin is useful to avoid to define a serializer class for each action in the
    `get_serializer_class` method.
    """

    serializer_classes: dict[str, type] = {}
    default_serializer_class: type = None

    def get_serializer_class(self):
        """
        Return the serializer class to use depending on the action.
        """
        return self.serializer_classes.get(self.action, self.default_serializer_class)


class Pagination(pagination.PageNumberPagination):
    """Pagination to display no more than 100 objects per page sorted by creation date."""

    ordering = "-created_on"
    max_page_size = 100
    page_size_query_param = "page_size"


class UserViewSet(
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """User ViewSet"""

    permission_classes = [permissions.IsSelf]
    queryset = models.User.objects.all()
    serializer_class = serializers.UserSerializer

    @decorators.action(
        detail=False,
        methods=["get"],
        url_name="me",
        url_path="me",
        permission_classes=[permissions.IsAuthenticated],
    )
    def get_me(self, request):
        """
        Return information on currently logged user
        """
        context = {"request": request}
        return drf_response.Response(
            self.serializer_class(request.user, context=context).data
        )


class ResourceViewsetMixin:
    """Mixin with methods common to all resource viewsets that are managed with accesses."""

    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Custom queryset to get user related resources."""
        queryset = super().get_queryset()
        if not self.request.user.is_authenticated:
            return queryset.filter(is_public=True)

        user = self.request.user
        teams = user.get_teams()

        user_roles_query = (
            self.access_model_class.objects.filter(
                Q(user=user) | Q(team__in=teams),
                **{self.resource_field_name: OuterRef("pk")},
            )
            .values(self.resource_field_name)
            .annotate(roles_array=ArrayAgg("role"))
            .values("roles_array")
        )
        return (
            queryset.filter(
                Q(accesses__user=user) | Q(accesses__team__in=teams) | Q(is_public=True)
            )
            .annotate(user_roles=Subquery(user_roles_query))
            .distinct()
        )

    def perform_create(self, serializer):
        """Set the current user as owner of the newly created object."""
        obj = serializer.save()
        self.access_model_class.objects.create(
            user=self.request.user,
            role=models.RoleChoices.OWNER,
            **{self.resource_field_name: obj},
        )


class ResourceAccessViewsetMixin:
    """Mixin with methods common to all access viewsets."""

    def get_permissions(self):
        """User only needs to be authenticated to list resource accesses"""
        if self.action == "list":
            permission_classes = [permissions.IsAuthenticated]
        else:
            return super().get_permissions()

        return [permission() for permission in permission_classes]

    def get_serializer_context(self):
        """Extra context provided to the serializer class."""
        context = super().get_serializer_context()
        context["resource_id"] = self.kwargs["resource_id"]
        return context

    def get_queryset(self):
        """Return the queryset according to the action."""
        queryset = super().get_queryset()
        queryset = queryset.filter(
            **{self.resource_field_name: self.kwargs["resource_id"]}
        )

        if self.action == "list":
            user = self.request.user
            teams = user.get_teams()

            user_roles_query = (
                queryset.filter(
                    Q(user=user) | Q(team__in=teams),
                    **{self.resource_field_name: self.kwargs["resource_id"]},
                )
                .values(self.resource_field_name)
                .annotate(roles_array=ArrayAgg("role"))
                .values("roles_array")
            )

            # Limit to resource access instances related to a resource THAT also has
            # a resource access
            # instance for the logged-in user (we don't want to list only the resource
            # access instances pointing to the logged-in user)
            queryset = (
                queryset.filter(
                    Q(**{f"{self.resource_field_name}__accesses__user": user})
                    | Q(**{f"{self.resource_field_name}__accesses__team__in": teams}),
                    **{self.resource_field_name: self.kwargs["resource_id"]},
                )
                .annotate(user_roles=Subquery(user_roles_query))
                .distinct()
            )
        return queryset

    def destroy(self, request, *args, **kwargs):
        """Forbid deleting the last owner access"""
        instance = self.get_object()
        resource = getattr(instance, self.resource_field_name)

        # Check if the access being deleted is the last owner access for the resource
        if (
            instance.role == "owner"
            and resource.accesses.filter(role="owner").count() == 1
        ):
            return drf_response.Response(
                {"detail": "Cannot delete the last owner access for the resource."},
                status=403,
            )

        return super().destroy(request, *args, **kwargs)

    def perform_update(self, serializer):
        """Check that we don't change the role if it leads to losing the last owner."""
        instance = serializer.instance

        # Check if the role is being updated and the new role is not "owner"
        if (
            "role" in self.request.data
            and self.request.data["role"] != models.RoleChoices.OWNER
        ):
            resource = getattr(instance, self.resource_field_name)
            # Check if the access being updated is the last owner access for the resource
            if (
                instance.role == models.RoleChoices.OWNER
                and resource.accesses.filter(role=models.RoleChoices.OWNER).count() == 1
            ):
                message = "Cannot change the role to a non-owner role for the last owner access."
                raise exceptions.PermissionDenied({"detail": message})

        serializer.save()


class DocumentViewSet(
    ResourceViewsetMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Document ViewSet"""

    permission_classes = [
        permissions.IsAuthenticatedOrSafe,
        permissions.AccessPermission,
    ]
    serializer_class = serializers.DocumentSerializer
    access_model_class = models.DocumentAccess
    resource_field_name = "document"
    queryset = models.Document.objects.all()

    @decorators.action(detail=True, methods=["get"], url_path="versions")
    def versions_list(self, request, *args, **kwargs):
        """
        Return the document's versions but only those created after the user got access
        to the document
        """
        document = self.get_object()
        from_datetime = min(
            access.created_at
            for access in document.accesses.filter(
                Q(user=request.user) | Q(team__in=request.user.get_teams()),
            )
        )
        return drf_response.Response(
            document.get_versions_slice(from_datetime=from_datetime)
        )

    @decorators.action(
        detail=True,
        methods=["get", "delete"],
        url_path="versions/(?P<version_id>[0-9a-f-]{36})",
    )
    # pylint: disable=unused-argument
    def versions_detail(self, request, pk, version_id, *args, **kwargs):
        """Custom action to retrieve a specific version of a document"""
        document = self.get_object()

        try:
            response = document.get_content_response(version_id=version_id)
        except (FileNotFoundError, ClientError) as err:
            raise Http404 from err

        # Don't let users access versions that were created before they were given access
        # to the document
        from_datetime = min(
            access.created_at
            for access in document.accesses.filter(
                Q(user=request.user) | Q(team__in=request.user.get_teams()),
            )
        )
        if response["LastModified"] < from_datetime:
            raise Http404

        if request.method == "DELETE":
            response = document.delete_version(version_id)
            return drf_response.Response(
                status=response["ResponseMetadata"]["HTTPStatusCode"]
            )

        return drf_response.Response(
            {
                "content": response["Body"].read().decode("utf-8"),
                "last_modified": response["LastModified"],
            }
        )


class DocumentAccessViewSet(
    ResourceAccessViewsetMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    API ViewSet for all interactions with document accesses.

    GET /api/v1.0/documents/<resource_id>/accesses/:<document_access_id>
        Return list of all document accesses related to the logged-in user or one
        document access if an id is provided.

    POST /api/v1.0/documents/<resource_id>/accesses/ with expected data:
        - user: str
        - role: str [owner|admin|member]
        Return newly created document access

    PUT /api/v1.0/documents/<resource_id>/accesses/<document_access_id>/ with expected data:
        - role: str [owner|admin|member]
        Return updated document access

    PATCH /api/v1.0/documents/<resource_id>/accesses/<document_access_id>/ with expected data:
        - role: str [owner|admin|member]
        Return partially updated document access

    DELETE /api/v1.0/documents/<resource_id>/accesses/<document_access_id>/
        Delete targeted document access
    """

    lookup_field = "pk"
    pagination_class = Pagination
    permission_classes = [permissions.IsAuthenticated, permissions.AccessPermission]
    queryset = models.DocumentAccess.objects.select_related("user").all()
    resource_field_name = "document"
    serializer_class = serializers.DocumentAccessSerializer


class TemplateViewSet(
    ResourceViewsetMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Template ViewSet"""

    permission_classes = [
        permissions.IsAuthenticatedOrSafe,
        permissions.AccessPermission,
    ]
    serializer_class = serializers.TemplateSerializer
    access_model_class = models.TemplateAccess
    resource_field_name = "template"
    queryset = models.Template.objects.all()

    @decorators.action(
        detail=True,
        methods=["post"],
        url_path="generate-document",
        permission_classes=[permissions.AccessPermission],
    )
    # pylint: disable=unused-argument
    def generate_document(self, request, pk=None):
        """
        Generate and return pdf for this template with the content passed.
        """
        serializer = serializers.DocumentGenerationSerializer(data=request.data)

        if not serializer.is_valid():
            return drf_response.Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        body = serializer.validated_data["body"]
        body_type = serializer.validated_data["body_type"]

        template = self.get_object()
        pdf_content = template.generate_document(body, body_type)

        response = FileResponse(BytesIO(pdf_content), content_type="application/pdf")
        response["Content-Disposition"] = f"attachment; filename={template.title}.pdf"
        return response


class TemplateAccessViewSet(
    ResourceAccessViewsetMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    API ViewSet for all interactions with template accesses.

    GET /api/v1.0/templates/<template_id>/accesses/:<template_access_id>
        Return list of all template accesses related to the logged-in user or one
        template access if an id is provided.

    POST /api/v1.0/templates/<template_id>/accesses/ with expected data:
        - user: str
        - role: str [owner|admin|member]
        Return newly created template access

    PUT /api/v1.0/templates/<template_id>/accesses/<template_access_id>/ with expected data:
        - role: str [owner|admin|member]
        Return updated template access

    PATCH /api/v1.0/templates/<template_id>/accesses/<template_access_id>/ with expected data:
        - role: str [owner|admin|member]
        Return partially updated template access

    DELETE /api/v1.0/templates/<template_id>/accesses/<template_access_id>/
        Delete targeted template access
    """

    lookup_field = "pk"
    pagination_class = Pagination
    permission_classes = [permissions.IsAuthenticated, permissions.AccessPermission]
    queryset = models.TemplateAccess.objects.select_related("user").all()
    resource_field_name = "template"
    serializer_class = serializers.TemplateAccessSerializer


class InvitationViewset(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """API ViewSet for user invitations to document.

    GET /api/v1.0/documents/<document_id>/invitations/:<invitation_id>/
        Return list of invitations related to that document or one
        document access if an id is provided.

    POST /api/v1.0/documents/<document_id>/invitations/ with expected data:
        - email: str
        - role: str [owner|admin|member]
        Return newly created invitation (issuer and document are automatically set)

    PUT / PATCH : Not permitted. Instead of updating your invitation,
        delete and create a new one.

    DELETE  /api/v1.0/documents/<document_id>/invitations/<invitation_id>/
        Delete targeted invitation
    """

    lookup_field = "id"
    pagination_class = Pagination
    permission_classes = [permissions.IsAuthenticated, permissions.AccessPermission]
    queryset = (
        models.Invitation.objects.all()
        .select_related("document")
        .order_by("-created_at")
    )
    serializer_class = serializers.InvitationSerializer

    def get_serializer_context(self):
        """Extra context provided to the serializer class."""
        context = super().get_serializer_context()
        context["resource_id"] = self.kwargs["resource_id"]
        return context

    def get_queryset(self):
        """Return the queryset according to the action."""
        queryset = super().get_queryset()
        queryset = queryset.filter(document=self.kwargs["resource_id"])

        if self.action == "list":
            user = self.request.user
            teams = user.get_teams()

            # Determine which role the logged-in user has in the document
            user_roles_query = (
                models.DocumentAccess.objects.filter(
                    Q(user=user) | Q(team__in=teams),
                    document=self.kwargs["resource_id"],
                )
                .values("document")
                .annotate(roles_array=ArrayAgg("role"))
                .values("roles_array")
            )

            queryset = (
                # The logged-in user should be part of a document to see its accesses
                queryset.filter(
                    Q(document__accesses__user=user)
                    | Q(document__accesses__team__in=teams),
                )
                # Abilities are computed based on logged-in user's role and
                # the user role on each document access
                .annotate(user_roles=Subquery(user_roles_query))
                .distinct()
            )
        return queryset
