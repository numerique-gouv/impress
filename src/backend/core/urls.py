"""URL configuration for the core app."""
from django.urls import path

from core.views import generate_document

urlpatterns = [
    path('generate-document/', generate_document, name='generate_document'),
]
