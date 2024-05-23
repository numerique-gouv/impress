"""Admin classes and registrations for core app."""
from django.contrib import admin
from django.contrib.auth import admin as auth_admin
from django.utils.translation import gettext_lazy as _

from . import models


class TemplateAccessInline(admin.TabularInline):
    """Inline admin class for template accesses."""

    model = models.TemplateAccess
    extra = 0


@admin.register(models.User)
class UserAdmin(auth_admin.UserAdmin):
    """Admin class for the User model"""

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "id",
                    "admin_email",
                    "password",
                )
            },
        ),
        (_("Personal info"), {"fields": ("sub", "email", "language", "timezone")}),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_device",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (_("Important dates"), {"fields": ("created_at", "updated_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2"),
            },
        ),
    )
    inlines = (TemplateAccessInline,)
    list_display = (
        "id",
        "sub",
        "admin_email",
        "email",
        "is_active",
        "is_staff",
        "is_superuser",
        "is_device",
        "created_at",
        "updated_at",
    )
    list_filter = ("is_staff", "is_superuser", "is_device", "is_active")
    ordering = ("is_active", "-is_superuser", "-is_staff", "-is_device", "-updated_at")
    readonly_fields = ("id", "sub", "email", "created_at", "updated_at")
    search_fields = ("id", "sub", "admin_email", "email")


@admin.register(models.Template)
class TemplateAdmin(admin.ModelAdmin):
    """Template admin interface declaration."""

    inlines = (TemplateAccessInline,)

class DocumentAccessInline(admin.TabularInline):
    """Inline admin class for template accesses."""

    model = models.DocumentAccess
    extra = 0

@admin.register(models.Document)
class DocumentAdmin(admin.ModelAdmin):
    """Document admin interface declaration."""

    inlines = (DocumentAccessInline,)
    