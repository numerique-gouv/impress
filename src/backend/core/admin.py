"""Admin classes and registrations for Magnify's core app."""
from django.contrib import admin

from . import models


class IdentityInline(admin.TabularInline):
    """Inline admin class for user identities."""

    model = models.Identity
    extra = 0


@admin.register(models.User)
class UserAdmin(admin.ModelAdmin):
    """User admin interface declaration."""

    inlines = (IdentityInline,)


class TemplateAccessInline(admin.TabularInline):
    """Inline admin class for template accesses."""

    model = models.TemplateAccess
    extra = 0


@admin.register(models.Template)
class TemplateAdmin(admin.ModelAdmin):
    """Template admin interface declaration."""

    inlines = (TemplateAccessInline,)


@admin.register(models.Team)
class TeamAdmin(admin.ModelAdmin):
    """Team admin interface declaration."""
