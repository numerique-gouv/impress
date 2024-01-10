"""
Declare and configure the models for the publish core application
"""
import json
import os
import textwrap
import uuid

from django.conf import settings
from django.contrib.auth import models as auth_models
from django.contrib.auth.base_user import AbstractBaseUser
from django.core import exceptions, mail, validators
from django.db import models
from django.utils.functional import lazy
from django.utils.translation import gettext_lazy as _

from django.template.base import Template as DjangoTemplate
from django.template.context import Context
from django.template.engine import Engine

import markdown
from weasyprint import CSS, HTML
from weasyprint.text.fonts import FontConfiguration

import jsonschema
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.settings import api_settings
from timezone_field import TimeZoneField


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

    email = models.EmailField(_("email address"), unique=True)
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

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "publish_user"
        verbose_name = _("user")
        verbose_name_plural = _("users")


class Identity(BaseModel):
    """User identity"""

    sub_validator = validators.RegexValidator(
        regex=r"^[\w.@+-]+\Z",
        message=_(
            "Enter a valid sub. This value may contain only letters, "
            "numbers, and @/./+/-/_ characters."
        ),
    )

    user = models.ForeignKey(User, related_name="identities", on_delete=models.CASCADE)
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
    email = models.EmailField(_("email address"))
    is_main = models.BooleanField(
        _("main"),
        default=False,
        help_text=_("Designates whether the email is the main one."),
    )

    class Meta:
        db_table = "publish_identity"
        ordering = ("-is_main", "email")
        verbose_name = _("identity")
        verbose_name_plural = _("identities")
        constraints = [
            # Uniqueness
            models.UniqueConstraint(
                fields=["user", "email"],
                name="unique_user_email",
                violation_error_message=_(
                    "This email address is already declared for this user."
                ),
            ),
        ]

    def __str__(self):
        main_str = "[main]" if self.is_main else ""
        return f"{self.email:s}{main_str:s}"

    def clean(self):
        """Normalize the email field and clean the 'is_main' field."""
        self.email = User.objects.normalize_email(self.email)
        if not self.user.identities.exclude(pk=self.pk).filter(is_main=True).exists():
            if not self.created_at:
                self.is_main = True
            elif not self.is_main:
                raise exceptions.ValidationError(
                    {"is_main": "A user should have one and only one main identity."}
                )
        super().clean()

    def save(self, *args, **kwargs):
        """Ensure users always have one and only one main identity."""
        super().save(*args, **kwargs)
        if self.is_main is True:
            self.user.identities.exclude(id=self.id).update(is_main=False)


class Team(BaseModel):
    """Team used for role based access control when matched with teams in OIDC tokens."""

    name = models.CharField(max_length=100)

    class Meta:
        db_table = "publish_role"
        ordering = ("name",)
        verbose_name = _("Team")
        verbose_name_plural = _("Teams")

    def __str__(self):
        return self.name


class Template(BaseModel):
    """HTML and CSS code used for formatting the print around the MarkDown body."""

    title = models.CharField(_("title"), max_length=255)
    description = models.TextField(_("description"), blank=True)
    code = models.TextField(_("code"), blank=True)
    css = models.TextField(_("css"), blank=True)
    is_public = models.BooleanField(
        _("public"),
        default=False,
        help_text=_("Whether this template is public for anyone to use."),
    )

    class Meta:
        db_table = "publish_template"
        ordering = ("title",)
        verbose_name = _("Template")
        verbose_name_plural = _("Templates")

    def __str__(self):
        return self.title


        if not self.body:
            return ""
        return markdown.markdown(textwrap.dedent(self.body))

    def generate_document(self, body):
        """
        Generate and return a PDF document for this template around the
        markdown body passed as argument.
        """
        body_html = markdown.markdown(textwrap.dedent(body)) if body else ""
        document_html = HTML(string=DjangoTemplate(self.code).render(Context({"body": body_html})))
        css = CSS(
            string=self.css,
            font_config=FontConfiguration(),
        )
        return document_html.write_pdf(stylesheets=[css], zoom=1)


    def get_abilities(self, user):
        """
        Compute and return abilities for a given user on the template.
        """
        is_owner_or_admin = False
        role = None

        if user.is_authenticated:
            try:
                role = self.user_role
            except AttributeError:
                try:
                    role = self.accesses.filter(user=user).values("role")[0]["role"]
                except (TemplateAccess.DoesNotExist, IndexError):
                    role = None

            is_owner_or_admin = role in [RoleChoices.OWNER, RoleChoices.ADMIN]

        return {
            "get": True,
            "patch": is_owner_or_admin,
            "put": is_owner_or_admin,
            "delete": role == RoleChoices.OWNER,
            "manage_accesses": is_owner_or_admin,
        }


class TemplateAccess(BaseModel):
    """Link table between templates and contacts."""

    template = models.ForeignKey(
        Template,
        on_delete=models.CASCADE,
        related_name="accesses",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="accesses",
        null=True,
        blank=True,
    )
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name="accesses",
        null=True,
        blank=True,
    )
    role = models.CharField(
        max_length=20, choices=RoleChoices.choices, default=RoleChoices.MEMBER
    )

    class Meta:
        db_table = "publish_template_access"
        verbose_name = _("Template/user relation")
        verbose_name_plural = _("Template/user relations")
        constraints = [
            models.UniqueConstraint(
                fields=["user", "template"],
                name="unique_template_user",
                violation_error_message=_("This user is already in this template."),
            ),
            models.UniqueConstraint(
                fields=["team", "template"],
                name="unique_template_team",
                violation_error_message=_("This team is already in this template."),
            ),
        ]

    def __str__(self):
        return f"{self.user!s} is {self.role:s} in template {self.template!s}"

    def get_abilities(self, user):
        """
        Compute and return abilities for a given user taking into account
        the current state of the object.
        """
        is_template_owner_or_admin = False
        role = None

        if user.is_authenticated:
            try:
                role = self.user_role
            except AttributeError:
                try:
                    role = self._meta.model.objects.filter(
                        template=self.template_id, user=user
                    ).values("role")[0]["role"]
                except (self._meta.model.DoesNotExist, IndexError):
                    role = None

            is_template_owner_or_admin = role in [RoleChoices.OWNER, RoleChoices.ADMIN]

        if self.role == RoleChoices.OWNER:
            can_delete = (
                user.id == self.user_id
                and self.template.accesses.filter(role=RoleChoices.OWNER).count() > 1
            )
            set_role_to = [RoleChoices.ADMIN, RoleChoices.MEMBER] if can_delete else []
        else:
            can_delete = is_template_owner_or_admin
            set_role_to = []
            if role == RoleChoices.OWNER:
                set_role_to.append(RoleChoices.OWNER)
            if is_template_owner_or_admin:
                set_role_to.extend([RoleChoices.ADMIN, RoleChoices.MEMBER])

        # Remove the current role as we don't want to propose it as an option
        try:
            set_role_to.remove(self.role)
        except ValueError:
            pass

        return {
            "delete": can_delete,
            "get": bool(role),
            "patch": bool(set_role_to),
            "put": bool(set_role_to),
            "set_role_to": set_role_to,
        }


def oidc_user_getter(validated_token):
    """
    Given a valid OIDC token , retrieve, create or update corresponding user/contact/email from db.

    The token is expected to have the following fields in payload:
        - sub
        - email
        - ...
    """
    try:
        user_id = validated_token[api_settings.USER_ID_CLAIM]
    except KeyError as exc:
        raise InvalidToken(
            _("Token contained no recognizable user identification")
        ) from exc

    try:
        user = User.objects.get(identities__sub=user_id)
    except User.DoesNotExist:
        user = User.objects.create()
        Identities.objects.create(user=user, sub=user_id, email=validated_token["email"])

    return user
