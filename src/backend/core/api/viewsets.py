"""API endpoints"""
from io import BytesIO

from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import (
    OuterRef,
    Q,
    Subquery,
)
from django.http import FileResponse

from rest_framework import (
    decorators,
    exceptions,
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


class TemplateViewSet(
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
    queryset = models.Template.objects.all()

    def get_queryset(self):
        """Custom queryset to get user related templates."""
        if not self.request.user.is_authenticated:
            return models.Template.objects.filter(is_public=True)

        user = self.request.user
        teams = user.get_teams()

        user_roles_query = (
            models.TemplateAccess.objects.filter(
                Q(user=user) | Q(team__in=teams), template=OuterRef("pk")
            )
            .values("template")
            .annotate(roles_array=ArrayAgg("role"))
            .values("roles_array")
        )
        return (
            models.Template.objects.filter(
                Q(accesses__user=user) | Q(accesses__team__in=teams) | Q(is_public=True)
            )
            .annotate(user_roles=Subquery(user_roles_query))
            .distinct()
        )

    def perform_create(self, serializer):
        """Set the current user as owner of the newly created template."""
        template = serializer.save()
        models.TemplateAccess.objects.create(
            template=template,
            user=self.request.user,
            role=models.RoleChoices.OWNER,
        )

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

        template = self.get_object()
        pdf_content = template.generate_document(body)

        response = FileResponse(BytesIO(pdf_content), content_type="application/pdf")
        response["Content-Disposition"] = f"attachment; filename={template.title}.pdf"
        return response


class TemplateAccessViewSet(
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
    queryset = models.TemplateAccess.objects.all().select_related("user")
    serializer_class = serializers.TemplateAccessSerializer

    def get_permissions(self):
        """User only needs to be authenticated to list template accesses"""
        if self.action == "list":
            permission_classes = [permissions.IsAuthenticated]
        else:
            return super().get_permissions()

        return [permission() for permission in permission_classes]

    def get_serializer_context(self):
        """Extra context provided to the serializer class."""
        context = super().get_serializer_context()
        context["template_id"] = self.kwargs["template_id"]
        return context

    def get_queryset(self):
        """Return the queryset according to the action."""
        queryset = super().get_queryset()
        queryset = queryset.filter(template=self.kwargs["template_id"])

        if self.action == "list":
            user = self.request.user
            teams = user.get_teams()

            user_roles_query = (
                models.TemplateAccess.objects.filter(
                    Q(user=user) | Q(team__in=teams),
                    template=self.kwargs["template_id"],
                )
                .values("template")
                .annotate(roles_array=ArrayAgg("role"))
                .values("roles_array")
            )

            # Limit to template access instances related to a template THAT also has
            # a template access
            # instance for the logged-in user (we don't want to list only the template
            # access instances pointing to the logged-in user)
            queryset = (
                queryset.filter(
                    Q(template__accesses__user=user)
                    | Q(template__accesses__team__in=teams),
                    template=self.kwargs["template_id"],
                )
                .annotate(user_roles=Subquery(user_roles_query))
                .distinct()
            )
        return queryset

    def destroy(self, request, *args, **kwargs):
        """Forbid deleting the last owner access"""
        instance = self.get_object()
        template = instance.template

        # Check if the access being deleted is the last owner access for the template
        if (
            instance.role == "owner"
            and template.accesses.filter(role="owner").count() == 1
        ):
            return drf_response.Response(
                {"detail": "Cannot delete the last owner access for the template."},
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
            template = instance.template
            # Check if the access being updated is the last owner access for the template
            if (
                instance.role == models.RoleChoices.OWNER
                and template.accesses.filter(role=models.RoleChoices.OWNER).count() == 1
            ):
                message = "Cannot change the role to a non-owner role for the last owner access."
                raise exceptions.PermissionDenied({"detail": message})

        serializer.save()
