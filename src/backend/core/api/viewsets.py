"""API endpoints"""

import os
import re
import uuid
from urllib.parse import urlparse

from django.conf import settings
from django.contrib.postgres.aggregates import ArrayAgg
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from django.db.models import (
    OuterRef,
    Q,
    Subquery,
)
from django.http import Http404

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
from core.utils import email_invitation

from . import permissions, serializers, utils

ATTACHMENTS_FOLDER = "attachments"
UUID_REGEX = (
    r"[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}"
)
FILE_EXT_REGEX = r"\.[a-zA-Z]{3,4}"
MEDIA_URL_PATTERN = re.compile(
    f"{settings.MEDIA_URL:s}({UUID_REGEX:s})/"
    f"({ATTACHMENTS_FOLDER:s}/{UUID_REGEX:s}{FILE_EXT_REGEX:s})$"
)

# pylint: disable=too-many-ancestors

ATTACHMENTS_FOLDER = "attachments"


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
    mixins.UpdateModelMixin, viewsets.GenericViewSet, mixins.ListModelMixin
):
    """User ViewSet"""

    permission_classes = [permissions.IsSelf]
    queryset = models.User.objects.all()
    serializer_class = serializers.UserSerializer

    def get_queryset(self):
        """
        Limit listed users by querying the email field with a trigram similarity
        search if a query is provided.
        Limit listed users by excluding users already in the document if a document_id
        is provided.
        """
        queryset = self.queryset

        if self.action == "list":
            # Exclude all users already in the given document
            if document_id := self.request.GET.get("document_id", ""):
                queryset = queryset.exclude(documentaccess__document_id=document_id)

            # Filter users by email similarity
            if query := self.request.GET.get("q", ""):
                queryset = queryset.filter(email__trigram_word_similar=query)

        return queryset

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
    ordering_fields = ["created_at", "updated_at", "title"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Custom queryset to get user related resources."""
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset

        user_roles_query = (
            self.access_model_class.objects.filter(
                Q(user=user) | Q(team__in=user.teams),
                **{self.resource_field_name: OuterRef("pk")},
            )
            .values(self.resource_field_name)
            .annotate(roles_array=ArrayAgg("role"))
            .values("roles_array")
        )
        return queryset.annotate(user_roles=Subquery(user_roles_query)).distinct()

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
            teams = user.teams
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
                status=status.HTTP_403_FORBIDDEN,
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
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Document ViewSet"""

    permission_classes = [
        permissions.AccessPermission,
    ]
    serializer_class = serializers.DocumentSerializer
    access_model_class = models.DocumentAccess
    resource_field_name = "document"
    queryset = models.Document.objects.all()
    ordering = ["-updated_at"]

    def perform_create(self, serializer):
        """
        Override perform_create to use the provided ID in the payload if it exists
        """
        document_id = self.request.data.get("id")
        document = serializer.save(id=document_id) if document_id else serializer.save()

        self.access_model_class.objects.create(
            user=self.request.user,
            role=models.RoleChoices.OWNER,
            **{self.resource_field_name: document},
        )

    def list(self, request, *args, **kwargs):
        """Restrict resources returned by the list endpoint"""
        queryset = self.filter_queryset(self.get_queryset())
        user = self.request.user
        if user.is_authenticated:
            queryset = queryset.filter(
                Q(accesses__user=user)
                | Q(accesses__team__in=user.teams)
                | (
                    Q(link_traces__user=user)
                    & ~Q(link_reach=models.LinkReachChoices.RESTRICTED)
                )
            )
        else:
            queryset = queryset.none()

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return drf_response.Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """
        Add a trace that the document was accessed by a user. This is used to list documents
        on a user's list view even though the user has no specific role in the document (link
        access when the link reach configuration of the document allows it).
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)

        if self.request.user.is_authenticated:
            try:
                # Add a trace that the user visited the document (this is needed to include
                # the document in the user's list view)
                models.LinkTrace.objects.create(
                    document=instance,
                    user=self.request.user,
                )
            except ValidationError:
                # The trace already exists, so we just pass without doing anything
                pass

        return drf_response.Response(serializer.data)

    @decorators.action(detail=True, methods=["get"], url_path="versions")
    def versions_list(self, request, *args, **kwargs):
        """
        Return the document's versions but only those created after the user got access
        to the document
        """
        if not request.user.is_authenticated:
            raise exceptions.PermissionDenied("Authentication required.")

        document = self.get_object()
        user = request.user
        from_datetime = min(
            access.created_at
            for access in document.accesses.filter(
                Q(user=user) | Q(team__in=user.teams),
            )
        )

        versions_data = document.get_versions_slice(from_datetime=from_datetime)[
            "versions"
        ]
        paginator = pagination.PageNumberPagination()
        paginated_versions = paginator.paginate_queryset(versions_data, request)
        serialized_versions = serializers.DocumentVersionSerializer(
            paginated_versions, many=True
        )

        return paginator.get_paginated_response(serialized_versions.data)

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
        user = request.user
        from_datetime = min(
            access.created_at
            for access in document.accesses.filter(
                Q(user=user) | Q(team__in=user.teams),
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
                "id": version_id,
            }
        )

    @decorators.action(detail=True, methods=["put"], url_path="link-configuration")
    def link_configuration(self, request, *args, **kwargs):
        """Update link configuration with specific rights (cf get_abilities)."""
        # Check permissions first
        document = self.get_object()

        # Deserialize and validate the data
        serializer = serializers.LinkDocumentSerializer(
            document, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return drf_response.Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save()
        return drf_response.Response(serializer.data, status=status.HTTP_200_OK)

    @decorators.action(detail=True, methods=["post"], url_path="attachment-upload")
    def attachment_upload(self, request, *args, **kwargs):
        """Upload a file related to a given document"""
        # Check permissions first
        document = self.get_object()

        # Validate metadata in payload
        serializer = serializers.FileUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return drf_response.Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )
        # Extract the file extension from the original filename
        file = serializer.validated_data["file"]
        extension = os.path.splitext(file.name)[1]

        # Generate a generic yet unique filename to store the image in object storage
        file_id = uuid.uuid4()
        key = f"{document.key_base}/{ATTACHMENTS_FOLDER:s}/{file_id!s}{extension:s}"

        default_storage.save(key, file)
        return drf_response.Response(
            {"file": f"{settings.MEDIA_URL:s}{key:s}"}, status=status.HTTP_201_CREATED
        )

    @decorators.action(detail=False, methods=["get"], url_path="retrieve-auth")
    def retrieve_auth(self, request, *args, **kwargs):
        """
        This view is used by an Nginx subrequest to control access to a document's
        attachment file.

        The original url is passed by nginx in the "HTTP_X_ORIGINAL_URL" header.
        See corresponding ingress configuration in Helm chart and read about the
        nginx.ingress.kubernetes.io/auth-url annotation to understand how the Nginx ingress
        is configured to do this.

        Based on the original url and the logged in user, we must decide if we authorize Nginx
        to let this request go through (by returning a 200 code) or if we block it (by returning
        a 403 error). Note that we return 403 errors without any further details for security
        reasons.

        When we let the request go through, we compute authorization headers that will be added to
        the request going through thanks to the nginx.ingress.kubernetes.io/auth-response-headers
        annotation. The request will then be proxied to the object storage backend who will
        respond with the file after checking the signature included in headers.
        """
        original_url = urlparse(request.META.get("HTTP_X_ORIGINAL_URL"))
        match = MEDIA_URL_PATTERN.search(original_url.path)

        try:
            pk, attachment_key = match.groups()
        except AttributeError as excpt:
            raise exceptions.PermissionDenied() from excpt

        # Check permission
        try:
            document = models.Document.objects.get(pk=pk)
        except models.Document.DoesNotExist as excpt:
            raise exceptions.PermissionDenied() from excpt

        if not document.get_abilities(request.user).get("retrieve", False):
            raise exceptions.PermissionDenied()

        # Generate authorization headers and return an authorization to proceed with the request
        request = utils.generate_s3_authorization_headers(f"{pk:s}/{attachment_key:s}")
        return drf_response.Response("authorized", headers=request.headers, status=200)


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
        - role: str [administrator|editor|reader]
        Return newly created document access

    PUT /api/v1.0/documents/<resource_id>/accesses/<document_access_id>/ with expected data:
        - role: str [owner|admin|editor|reader]
        Return updated document access

    PATCH /api/v1.0/documents/<resource_id>/accesses/<document_access_id>/ with expected data:
        - role: str [owner|admin|editor|reader]
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

    def perform_create(self, serializer):
        """Add a new access to the document and send an email to the new added user."""
        access = serializer.save()

        language = self.request.headers.get("Content-Language", "en-us")
        email_invitation(language, access.user.email, access.document.id)


class TemplateViewSet(
    ResourceViewsetMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
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

    def list(self, request, *args, **kwargs):
        """Restrict templates returned by the list endpoint"""
        queryset = self.filter_queryset(self.get_queryset())
        user = self.request.user
        if user.is_authenticated:
            queryset = queryset.filter(
                Q(accesses__user=user)
                | Q(accesses__team__in=user.teams)
                | Q(is_public=True)
            )
        else:
            queryset = queryset.filter(is_public=True)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return drf_response.Response(serializer.data)

    @decorators.action(
        detail=True,
        methods=["post"],
        url_path="generate-document",
        permission_classes=[permissions.AccessPermission],
    )
    # pylint: disable=unused-argument
    def generate_document(self, request, pk=None):
        """
        Generate and return a document for this template around the
        body passed as argument.

        2 types of body are accepted:
        - HTML: body_type = "html"
        - Markdown: body_type = "markdown"

        2 types of documents can be generated:
        - PDF: format = "pdf"
        - Docx: format = "docx"
        """
        serializer = serializers.DocumentGenerationSerializer(data=request.data)

        if not serializer.is_valid():
            return drf_response.Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        body = serializer.validated_data["body"]
        body_type = serializer.validated_data["body_type"]
        export_format = serializer.validated_data["format"]

        template = self.get_object()
        return template.generate_document(body, body_type, export_format)


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
        - role: str [administrator|editor|reader]
        Return newly created template access

    PUT /api/v1.0/templates/<template_id>/accesses/<template_access_id>/ with expected data:
        - role: str [owner|admin|editor|reader]
        Return updated template access

    PATCH /api/v1.0/templates/<template_id>/accesses/<template_access_id>/ with expected data:
        - role: str [owner|admin|editor|reader]
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
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """API ViewSet for user invitations to document.

    GET /api/v1.0/documents/<document_id>/invitations/:<invitation_id>/
        Return list of invitations related to that document or one
        document access if an id is provided.

    POST /api/v1.0/documents/<document_id>/invitations/ with expected data:
        - email: str
        - role: str [administrator|editor|reader]
        Return newly created invitation (issuer and document are automatically set)

    PATCH /api/v1.0/documents/<document_id>/invitations/:<invitation_id>/ with expected data:
        - role: str [owner|admin|editor|reader]
        Return partially updated document invitation

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
            teams = user.teams

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

    def perform_create(self, serializer):
        """Save invitation to a document then send an email to the invited user."""
        invitation = serializer.save()

        language = self.request.headers.get("Content-Language", "en-us")
        email_invitation(language, invitation.email, invitation.document.id)
