"""
Declare and configure the models for the impress core application
"""

import hashlib
import smtplib
import tempfile
import textwrap
import uuid
from datetime import timedelta
from io import BytesIO
from logging import getLogger

from django.conf import settings
from django.contrib.auth import models as auth_models
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.sites.models import Site
from django.core import exceptions, mail, validators
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.mail import send_mail
from django.db import models
from django.http import FileResponse
from django.template.base import Template as DjangoTemplate
from django.template.context import Context
from django.template.loader import render_to_string
from django.utils import html, timezone
from django.utils.functional import cached_property, lazy
from django.utils.translation import gettext_lazy as _
from django.utils.translation import override

import frontmatter
import markdown
import pypandoc
import weasyprint
from botocore.exceptions import ClientError
from timezone_field import TimeZoneField

logger = getLogger(__name__)


def get_resource_roles(resource, user):
    """Compute the roles a user has on a resource."""
    if not user.is_authenticated:
        return []

    try:
        roles = resource.user_roles or []
    except AttributeError:
        try:
            roles = resource.accesses.filter(
                models.Q(user=user) | models.Q(team__in=user.teams),
            ).values_list("role", flat=True)
        except (models.ObjectDoesNotExist, IndexError):
            roles = []
    return roles


class LinkRoleChoices(models.TextChoices):
    """Defines the possible roles a link can offer on a document."""

    READER = "reader", _("Reader")  # Can read
    EDITOR = "editor", _("Editor")  # Can read and edit


class RoleChoices(models.TextChoices):
    """Defines the possible roles a user can have in a resource."""

    READER = "reader", _("Reader")  # Can read
    EDITOR = "editor", _("Editor")  # Can read and edit
    ADMIN = "administrator", _("Administrator")  # Can read, edit, delete and share
    OWNER = "owner", _("Owner")


class LinkReachChoices(models.TextChoices):
    """Defines types of access for links"""

    RESTRICTED = (
        "restricted",
        _("Restricted"),
    )  # Only users with a specific access can read/edit the document
    AUTHENTICATED = (
        "authenticated",
        _("Authenticated"),
    )  # Any authenticated user can access the document
    PUBLIC = "public", _("Public")  # Even anonymous users can access the document


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

    def save(self, *args, **kwargs):
        """
        If it's a new user, give its user access to the documents to which s.he was invited.
        """
        is_adding = self._state.adding
        super().save(*args, **kwargs)

        if is_adding:
            self._convert_valid_invitations()

    def _convert_valid_invitations(self):
        """
        Convert valid invitations to document accesses.
        Expired invitations are ignored.
        """
        valid_invitations = Invitation.objects.filter(
            email=self.email,
            created_at__gte=(
                timezone.now()
                - timedelta(seconds=settings.INVITATION_VALIDITY_DURATION)
            ),
        ).select_related("document")

        if not valid_invitations.exists():
            return

        DocumentAccess.objects.bulk_create(
            [
                DocumentAccess(
                    user=self, document=invitation.document, role=invitation.role
                )
                for invitation in valid_invitations
            ]
        )
        valid_invitations.delete()

    def email_user(self, subject, message, from_email=None, **kwargs):
        """Email this user."""
        if not self.email:
            raise ValueError("User has no email address.")
        mail.send_mail(subject, message, from_email, [self.email], **kwargs)

    @cached_property
    def teams(self):
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
        max_length=20, choices=RoleChoices.choices, default=RoleChoices.READER
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
            teams = user.teams
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
            set_role_to = (
                [RoleChoices.ADMIN, RoleChoices.EDITOR, RoleChoices.READER]
                if can_delete
                else []
            )
        else:
            can_delete = is_owner_or_admin
            set_role_to = []
            if RoleChoices.OWNER in roles:
                set_role_to.append(RoleChoices.OWNER)
            if is_owner_or_admin:
                set_role_to.extend(
                    [RoleChoices.ADMIN, RoleChoices.EDITOR, RoleChoices.READER]
                )

        # Remove the current role as we don't want to propose it as an option
        try:
            set_role_to.remove(self.role)
        except ValueError:
            pass

        return {
            "destroy": can_delete,
            "update": bool(set_role_to),
            "partial_update": bool(set_role_to),
            "retrieve": bool(roles),
            "set_role_to": set_role_to,
        }


class Document(BaseModel):
    """Pad document carrying the content."""

    title = models.CharField(_("title"), max_length=255, null=True, blank=True)
    link_reach = models.CharField(
        max_length=20,
        choices=LinkReachChoices.choices,
        default=LinkReachChoices.AUTHENTICATED,
    )
    link_role = models.CharField(
        max_length=20, choices=LinkRoleChoices.choices, default=LinkRoleChoices.READER
    )

    _content = None

    class Meta:
        db_table = "impress_document"
        ordering = ("title",)
        verbose_name = _("Document")
        verbose_name_plural = _("Documents")

    def __str__(self):
        return str(self.title) if self.title else str(_("Untitled Document"))

    def save(self, *args, **kwargs):
        """Write content to object storage only if _content has changed."""
        super().save(*args, **kwargs)

        if self._content:
            file_key = self.file_key
            bytes_content = self._content.encode("utf-8")

            # Attempt to directly check if the object exists using the storage client.
            try:
                response = default_storage.connection.meta.client.head_object(
                    Bucket=default_storage.bucket_name, Key=file_key
                )
            except ClientError as excpt:
                # If the error is a 404, the object doesn't exist, so we should create it.
                if excpt.response["Error"]["Code"] == "404":
                    has_changed = True
                else:
                    raise
            else:
                # Compare the existing ETag with the MD5 hash of the new content.
                has_changed = (
                    response["ETag"].strip('"')
                    != hashlib.md5(bytes_content).hexdigest()  # noqa: S324
                )

            if has_changed:
                content_file = ContentFile(bytes_content)
                default_storage.save(file_key, content_file)

    @property
    def key_base(self):
        """Key base of the location where the document is stored in object storage."""
        if not self.pk:
            raise RuntimeError(
                "The document instance must be saved before requesting a storage key."
            )
        return str(self.pk)

    @property
    def file_key(self):
        """Key of the object storage file to which the document content is stored"""
        return f"{self.key_base}/file"

    @property
    def content(self):
        """Return the json content from object storage if available"""
        if self._content is None and self.id:
            try:
                response = self.get_content_response()
            except (FileNotFoundError, ClientError):
                pass
            else:
                self._content = response["Body"].read().decode("utf-8")
        return self._content

    @content.setter
    def content(self, content):
        """Cache the content, don't write to object storage yet"""
        if not isinstance(content, str):
            raise ValueError("content should be a string.")

        self._content = content

    def get_content_response(self, version_id=""):
        """Get the content in a specific version of the document"""
        return default_storage.connection.meta.client.get_object(
            Bucket=default_storage.bucket_name, Key=self.file_key, VersionId=version_id
        )

    def get_versions_slice(self, from_version_id="", min_datetime=None, page_size=None):
        """Get document versions from object storage with pagination and starting conditions"""
        # /!\ Trick here /!\
        # The "KeyMarker" and "VersionIdMarker" fields must either be both set or both not set.
        # The error we get otherwise is not helpful at all.
        markers = {}
        if from_version_id:
            markers.update(
                {"KeyMarker": self.file_key, "VersionIdMarker": from_version_id}
            )

        real_page_size = (
            min(page_size, settings.DOCUMENT_VERSIONS_PAGE_SIZE)
            if page_size
            else settings.DOCUMENT_VERSIONS_PAGE_SIZE
        )

        response = default_storage.connection.meta.client.list_object_versions(
            Bucket=default_storage.bucket_name,
            Prefix=self.file_key,
            # compensate the latest version that we exclude below and get one more to
            # know if there are more pages
            MaxKeys=real_page_size + 2,
            **markers,
        )

        min_last_modified = min_datetime or self.created_at
        versions = [
            {
                key_snake: version[key_camel]
                for key_snake, key_camel in [
                    ("etag", "ETag"),
                    ("is_latest", "IsLatest"),
                    ("last_modified", "LastModified"),
                    ("version_id", "VersionId"),
                ]
            }
            for version in response.get("Versions", [])
            if version["LastModified"] >= min_last_modified
            and version["IsLatest"] is False
        ]
        results = versions[:real_page_size]

        count = len(results)
        if count == len(versions):
            is_truncated = False
            next_version_id_marker = ""
        else:
            is_truncated = True
            next_version_id_marker = versions[count - 1]["version_id"]

        return {
            "next_version_id_marker": next_version_id_marker,
            "is_truncated": is_truncated,
            "versions": results,
            "count": count,
        }

    def delete_version(self, version_id):
        """Delete a version from object storage given its version id"""
        return default_storage.connection.meta.client.delete_object(
            Bucket=default_storage.bucket_name, Key=self.file_key, VersionId=version_id
        )

    def get_abilities(self, user):
        """
        Compute and return abilities for a given user on the document.
        """
        roles = set(get_resource_roles(self, user))

        # Compute version roles before adding link roles because we don't
        # want anonymous users to access versions (we wouldn't know from
        # which date to allow them anyway)
        can_get_versions = bool(roles)

        # Add role provided by the document link
        if self.link_reach == LinkReachChoices.PUBLIC or (
            self.link_reach == LinkReachChoices.AUTHENTICATED and user.is_authenticated
        ):
            roles.add(self.link_role)

        is_owner_or_admin = bool(
            roles.intersection({RoleChoices.OWNER, RoleChoices.ADMIN})
        )
        is_editor = bool(RoleChoices.EDITOR in roles)
        can_get = bool(roles)

        return {
            "attachment_upload": is_owner_or_admin or is_editor,
            "destroy": RoleChoices.OWNER in roles,
            "link_configuration": is_owner_or_admin,
            "manage_accesses": is_owner_or_admin,
            "partial_update": is_owner_or_admin or is_editor,
            "retrieve": can_get,
            "update": is_owner_or_admin or is_editor,
            "versions_destroy": is_owner_or_admin,
            "versions_list": can_get_versions,
            "versions_retrieve": can_get_versions,
        }

    def email_invitation(self, language, email, role, username_sender):
        """Send email invitation."""

        domain = Site.objects.get_current().domain

        try:
            with override(language):
                title = _("%(username)s shared a document with you: %(document)s") % {
                    "username": username_sender,
                    "document": self.title,
                }
                template_vars = {
                    "title": title,
                    "domain": domain,
                    "document": self,
                    "link": f"{domain}/docs/{self.id}/",
                    "username": username_sender,
                    "role": RoleChoices(role).label.lower(),
                }
                msg_html = render_to_string("mail/html/invitation.html", template_vars)
                msg_plain = render_to_string("mail/text/invitation.txt", template_vars)
                send_mail(
                    title,
                    msg_plain,
                    settings.EMAIL_FROM,
                    [email],
                    html_message=msg_html,
                    fail_silently=False,
                )

        except smtplib.SMTPException as exception:
            logger.error("invitation to %s was not sent: %s", email, exception)


class LinkTrace(BaseModel):
    """
    Relation model to trace accesses to a document via a link by a logged-in user.
    This is necessary to show the document in the user's list of documents even
    though the user does not have a role on the document.
    """

    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name="link_traces",
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="link_traces")

    class Meta:
        db_table = "impress_link_trace"
        verbose_name = _("Document/user link trace")
        verbose_name_plural = _("Document/user link traces")
        constraints = [
            models.UniqueConstraint(
                fields=["user", "document"],
                name="unique_link_trace_document_user",
                violation_error_message=_(
                    "A link trace already exists for this document/user."
                ),
            ),
        ]

    def __str__(self):
        return f"{self.user!s} trace on document {self.document!s}"


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
        is_editor = bool(RoleChoices.EDITOR in roles)
        can_get = self.is_public or bool(roles)

        return {
            "destroy": RoleChoices.OWNER in roles,
            "generate_document": can_get,
            "manage_accesses": is_owner_or_admin,
            "update": is_owner_or_admin or is_editor,
            "partial_update": is_owner_or_admin or is_editor,
            "retrieve": can_get,
        }

    def generate_pdf(self, body_html, metadata):
        """
        Generate and return a pdf document wrapped around the current template
        """
        document_html = weasyprint.HTML(
            string=DjangoTemplate(self.code).render(
                Context({"body": html.format_html(body_html), **metadata})
            )
        )
        css = weasyprint.CSS(
            string=self.css,
            font_config=weasyprint.text.fonts.FontConfiguration(),
        )

        pdf_content = document_html.write_pdf(stylesheets=[css], zoom=1)
        response = FileResponse(BytesIO(pdf_content), content_type="application/pdf")
        response["Content-Disposition"] = f"attachment; filename={self.title}.pdf"

        return response

    def generate_word(self, body_html, metadata):
        """
        Generate and return a docx document wrapped around the current template
        """
        template_string = DjangoTemplate(self.code).render(
            Context({"body": html.format_html(body_html), **metadata})
        )

        html_string = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                {self.css}
            </style>
        </head>
        <body>
            {template_string}
        </body>
        </html>
        """

        reference_docx = "core/static/reference.docx"
        output = BytesIO()

        # Convert the HTML to a temporary docx file
        with tempfile.NamedTemporaryFile(suffix=".docx", prefix="docx_") as tmp_file:
            output_path = tmp_file.name

            pypandoc.convert_text(
                html_string,
                "docx",
                format="html",
                outputfile=output_path,
                extra_args=["--reference-doc", reference_docx],
            )

            # Create a BytesIO object to store the output of the temporary docx file
            with open(output_path, "rb") as f:
                output = BytesIO(f.read())

        # Ensure the pointer is at the beginning
        output.seek(0)

        response = FileResponse(
            output,
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        response["Content-Disposition"] = f"attachment; filename={self.title}.docx"

        return response

    def generate_document(self, body, body_type, export_format):
        """
        Generate and return a document for this template around the
        body passed as argument.

        2 types of body are accepted:
        - HTML: body_type = "html"
        - Markdown: body_type = "markdown"

        2 types of documents can be generated:
        - PDF: export_format = "pdf"
        - Docx: export_format = "docx"
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

        if export_format == "pdf":
            return self.generate_pdf(body_html, metadata)

        return self.generate_word(body_html, metadata)


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


class Invitation(BaseModel):
    """User invitation to a document."""

    email = models.EmailField(_("email address"), null=False, blank=False)
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name="invitations",
    )
    role = models.CharField(
        max_length=20, choices=RoleChoices.choices, default=RoleChoices.READER
    )
    issuer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="invitations",
    )

    class Meta:
        db_table = "impress_invitation"
        verbose_name = _("Document invitation")
        verbose_name_plural = _("Document invitations")
        constraints = [
            models.UniqueConstraint(
                fields=["email", "document"], name="email_and_document_unique_together"
            )
        ]

    def __str__(self):
        return f"{self.email} invited to {self.document}"

    def clean(self):
        """Validate fields."""
        super().clean()

        # Check if an identity already exists for the provided email
        if User.objects.filter(email=self.email).exists():
            raise exceptions.ValidationError(
                {"email": _("This email is already associated to a registered user.")}
            )

    @property
    def is_expired(self):
        """Calculate if invitation is still valid or has expired."""
        if not self.created_at:
            return None

        validity_duration = timedelta(seconds=settings.INVITATION_VALIDITY_DURATION)
        return timezone.now() > (self.created_at + validity_duration)

    def get_abilities(self, user):
        """Compute and return abilities for a given user."""
        can_delete = False
        can_update = False
        roles = []

        if user.is_authenticated:
            teams = user.teams
            try:
                roles = self.user_roles or []
            except AttributeError:
                try:
                    roles = self.document.accesses.filter(
                        models.Q(user=user) | models.Q(team__in=teams),
                    ).values_list("role", flat=True)
                except (self._meta.model.DoesNotExist, IndexError):
                    roles = []

            can_delete = bool(
                set(roles).intersection({RoleChoices.OWNER, RoleChoices.ADMIN})
            )

            can_update = bool(
                set(roles).intersection({RoleChoices.OWNER, RoleChoices.ADMIN})
            )

        return {
            "destroy": can_delete,
            "update": can_update,
            "partial_update": can_update,
            "retrieve": bool(roles),
        }
