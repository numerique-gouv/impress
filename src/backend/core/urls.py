"""URL configuration for the core app."""
from django.urls import path

from core.views import generate_document, TemplatesApiView, GenerateDocumentAPIView

urlpatterns = [
    path('generate-document/', generate_document, name='generate_document'),
    path('api/generate-document/', GenerateDocumentAPIView.as_view(), name='generate-document'),
    path('api/templates', TemplatesApiView.as_view()),
]
