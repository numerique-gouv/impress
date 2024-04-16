"""
Declare and configure the models for the impress core application
"""
import textwrap
import uuid

from django.conf import settings
from django.contrib.auth import models as auth_models
from django.contrib.auth.base_user import AbstractBaseUser
from django.core import mail, validators
from django.db import models
from django.template.base import Template as DjangoTemplate
from django.template.context import Context
from django.utils.functional import lazy
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

import frontmatter
import markdown
from timezone_field import TimeZoneField
from weasyprint import CSS, HTML
from weasyprint.text.fonts import FontConfiguration


def get_resource_roles(resource, user):
    """Compute the roles a user has on a resource."""
    roles = []
    if user.is_authenticated:
        try:
            roles = resource.user_roles or []
        except AttributeError:
            teams = user.get_teams()
            try:
                roles = resource.accesses.filter(
                    models.Q(user=user) | models.Q(team__in=teams),
                ).values_list("role", flat=True)
            except (models.ObjectDoesNotExist, IndexError):
                roles = []
    return roles


class RoleChoices(models.TextChoices):
    """Defines the possible roles a user can have in a template."""

    MEMBER = "member", _("Member")
    ADMIN = "administrator", _("Administrator")
    OWNER = "owner", _("Owner")


class BaseModel(models.Model):
    """
    Serves as an abstract base model for other models, ensuring that records are validated
    before saving as Django doesn't do it by default.

    Includes fields common to all models: a UUID primary key and creation/update timestamps.
    """

    id = models.UUIDField(
        verbose_name=_("id"),
        help_text=_("primary key for the record as UUID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    created_at = models.DateTimeField(
        verbose_name=_("created on"),
        help_text=_("date and time at which a record was created"),
        auto_now_add=True,
        editable=False,
    )
    updated_at = models.DateTimeField(
        verbose_name=_("updated on"),
        help_text=_("date and time at which a record was last updated"),
        auto_now=True,
        editable=False,
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        """Call `full_clean` before saving."""
        self.full_clean()
        super().save(*args, **kwargs)


class User(AbstractBaseUser, BaseModel, auth_models.PermissionsMixin):
    """User model to work with OIDC only authentication."""

    sub_validator = validators.RegexValidator(
        regex=r"^[\w.@+-]+\Z",
        message=_(
            "Enter a valid sub. This value may contain only letters, "
            "numbers, and @/./+/-/_ characters."
        ),
    )

    sub = models.CharField(
        _("sub"),
        help_text=_(
            "Required. 255 characters or fewer. Letters, numbers, and @/./+/-/_ characters only."
        ),
        max_length=255,
        unique=True,
        validators=[sub_validator],
        blank=True,
        null=True,
    )
    email = models.EmailField(_("identity email address"), blank=True, null=True)

    # Unlike the "email" field which stores the email coming from the OIDC token, this field
    # stores the email used by staff users to login to the admin site
    admin_email = models.EmailField(
        _("admin email address"), unique=True, blank=True, null=True
    )

    language = models.CharField(
        max_length=10,
        choices=lazy(lambda: settings.LANGUAGES, tuple)(),
        default=settings.LANGUAGE_CODE,
        verbose_name=_("language"),
        help_text=_("The language in which the user wants to see the interface."),
    )
    timezone = TimeZoneField(
        choices_display="WITH_GMT_OFFSET",
        use_pytz=False,
        default=settings.TIME_ZONE,
        help_text=_("The timezone in which the user wants to see times."),
    )
    is_device = models.BooleanField(
        _("device"),
        default=False,
        help_text=_("Whether the user is a device or a real user."),
    )
    is_staff = models.BooleanField(
        _("staff status"),
        default=False,
        help_text=_("Whether the user can log into this admin site."),
    )
    is_active = models.BooleanField(
        _("active"),
        default=True,
        help_text=_(
            "Whether this user should be treated as active. "
            "Unselect this instead of deleting accounts."
        ),
    )

    objects = auth_models.UserManager()

    USERNAME_FIELD = "admin_email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "impress_user"
        verbose_name = _("user")
        verbose_name_plural = _("users")

    def __str__(self):
        return self.email or self.admin_email or str(self.id)

    def email_user(self, subject, message, from_email=None, **kwargs):
        """Email this user."""
        if not self.email:
            raise ValueError("User has no email address.")
        mail.send_mail(subject, message, from_email, [self.email], **kwargs)

    def get_teams(self):
        """
        Get list of teams in which the user is, as a list of strings.
        Must be cached if retrieved remotely.
        """
        return []


class BaseAccess(BaseModel):
    """Base model for accesses to handle resources."""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    team = models.CharField(max_length=100, blank=True)
    role = models.CharField(
        max_length=20, choices=RoleChoices.choices, default=RoleChoices.MEMBER
    )

    class Meta:
        abstract = True

    def _get_abilities(self, resource, user):
        """
        Compute and return abilities for a given user taking into account
        the current state of the object.
        """
        roles = []
        if user.is_authenticated:
            teams = user.get_teams()
            try:
                roles = self.user_roles or []
            except AttributeError:
                try:
                    roles = resource.accesses.filter(
                        models.Q(user=user) | models.Q(team__in=teams),
                    ).values_list("role", flat=True)
                except (self._meta.model.DoesNotExist, IndexError):
                    roles = []

        is_owner_or_admin = bool(
            set(roles).intersection({RoleChoices.OWNER, RoleChoices.ADMIN})
        )
        if self.role == RoleChoices.OWNER:
            can_delete = (
                RoleChoices.OWNER in roles
                and resource.accesses.filter(role=RoleChoices.OWNER).count() > 1
            )
            set_role_to = [RoleChoices.ADMIN, RoleChoices.MEMBER] if can_delete else []
        else:
            can_delete = is_owner_or_admin
            set_role_to = []
            if RoleChoices.OWNER in roles:
                set_role_to.append(RoleChoices.OWNER)
            if is_owner_or_admin:
                set_role_to.extend([RoleChoices.ADMIN, RoleChoices.MEMBER])

        # Remove the current role as we don't want to propose it as an option
        try:
            set_role_to.remove(self.role)
        except ValueError:
            pass

        return {
            "destroy": can_delete,
            "update": bool(set_role_to),
            "retrieve": bool(roles),
            "set_role_to": set_role_to,
        }


class Document(BaseModel):
    """Pad document carrying the content."""

    title = models.CharField(_("title"), max_length=255)
    is_public = models.BooleanField(
        _("public"),
        default=False,
        help_text=_("Whether this document is public for anyone to use."),
    )

    class Meta:
        db_table = "impress_document"
        ordering = ("title",)
        verbose_name = _("Document")
        verbose_name_plural = _("Documents")

    def __str__(self):
        return self.title

    def get_abilities(self, user):
        """
        Compute and return abilities for a given user on the document.
        """
        roles = get_resource_roles(self, user)
        is_owner_or_admin = bool(
            set(roles).intersection({RoleChoices.OWNER, RoleChoices.ADMIN})
        )
        can_get = self.is_public or bool(roles)

        return {
            "destroy": RoleChoices.OWNER in roles,
            "manage_accesses": is_owner_or_admin,
            "update": is_owner_or_admin,
            "partial_update": is_owner_or_admin,
            "retrieve": can_get,
        }


class DocumentAccess(BaseAccess):
    """Relation model to give access to a document for a user or a team with a role."""

    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name="accesses",
    )

    class Meta:
        db_table = "impress_document_access"
        ordering = ("-created_at",)
        verbose_name = _("Document/user relation")
        verbose_name_plural = _("Document/user relations")
        constraints = [
            models.UniqueConstraint(
                fields=["user", "document"],
                condition=models.Q(user__isnull=False),  # Exclude null users
                name="unique_document_user",
                violation_error_message=_("This user is already in this document."),
            ),
            models.UniqueConstraint(
                fields=["team", "document"],
                condition=models.Q(team__gt=""),  # Exclude empty string teams
                name="unique_document_team",
                violation_error_message=_("This team is already in this document."),
            ),
            models.CheckConstraint(
                check=models.Q(user__isnull=False, team="")
                | models.Q(user__isnull=True, team__gt=""),
                name="check_document_access_either_user_or_team",
                violation_error_message=_("Either user or team must be set, not both."),
            ),
        ]

    def __str__(self):
        return f"{self.user!s} is {self.role:s} in document {self.document!s}"

    def get_abilities(self, user):
        """
        Compute and return abilities for a given user on the document access.
        """
        return self._get_abilities(self.document, user)


class Template(BaseModel):
    """HTML and CSS code used for formatting the print around the MarkDown body."""

    title = models.CharField(_("title"), max_length=255)
    description = models.TextField(_("description"), blank=True)
    code_editor = models.JSONField(
        _("code editor"),
        help_text=_("A JSON object with all the editor information"),
        blank=True,
        default=dict,
    )
    code = models.TextField(_("code"), blank=True)
    css = models.TextField(_("css"), blank=True)
    is_public = models.BooleanField(
        _("public"),
        default=False,
        help_text=_("Whether this template is public for anyone to use."),
    )

    class Meta:
        db_table = "impress_template"
        ordering = ("title",)
        verbose_name = _("Template")
        verbose_name_plural = _("Templates")

    def __str__(self):
        return self.title

    def get_abilities(self, user):
        """
        Compute and return abilities for a given user on the template.
        """
        roles = get_resource_roles(self, user)
        is_owner_or_admin = bool(
            set(roles).intersection({RoleChoices.OWNER, RoleChoices.ADMIN})
        )
        can_get = self.is_public or bool(roles)

        return {
            "destroy": RoleChoices.OWNER in roles,
            "generate_document": can_get,
            "manage_accesses": is_owner_or_admin,
            "update": is_owner_or_admin,
            "partial_update": is_owner_or_admin,
            "retrieve": can_get,
        }

    def generate_document(self, body, body_type):
        """
        Generate and return a PDF document for this template around the
        body passed as argument.
        """
        document = frontmatter.loads(body)
        metadata = document.metadata
        strip_body = document.content.strip()

        if body_type == "html":
            body_html = strip_body
        else:
            body_html = (
                markdown.markdown(textwrap.dedent(strip_body)) if strip_body else ""
            )

        document_html = HTML(
            string=DjangoTemplate(self.code).render(
                Context({"body": format_html(body_html), **metadata})
            )
        )
        css = CSS(
            string=self.css,
            font_config=FontConfiguration(),
        )
        return document_html.write_pdf(stylesheets=[css], zoom=1)


class TemplateAccess(BaseAccess):
    """Relation model to give access to a template for a user or a team with a role."""

    template = models.ForeignKey(
        Template,
        on_delete=models.CASCADE,
        related_name="accesses",
    )

    class Meta:
        db_table = "impress_template_access"
        ordering = ("-created_at",)
        verbose_name = _("Template/user relation")
        verbose_name_plural = _("Template/user relations")
        constraints = [
            models.UniqueConstraint(
                fields=["user", "template"],
                condition=models.Q(user__isnull=False),  # Exclude null users
                name="unique_template_user",
                violation_error_message=_("This user is already in this template."),
            ),
            models.UniqueConstraint(
                fields=["team", "template"],
                condition=models.Q(team__gt=""),  # Exclude empty string teams
                name="unique_template_team",
                violation_error_message=_("This team is already in this template."),
            ),
            models.CheckConstraint(
                check=models.Q(user__isnull=False, team="")
                | models.Q(user__isnull=True, team__gt=""),
                name="check_template_access_either_user_or_team",
                violation_error_message=_("Either user or team must be set, not both."),
            ),
        ]

    def __str__(self):
        return f"{self.user!s} is {self.role:s} in template {self.template!s}"

    def get_abilities(self, user):
        """
        Compute and return abilities for a given user on the template access.
        """
        return self._get_abilities(self.template, user)
