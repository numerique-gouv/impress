"""Forms for the core app of Publish"""
from django import forms
from .models import Template

class DocumentGenerationForm(forms.Form):
    body = forms.CharField(widget=forms.Textarea, label="Markdown Body")
    template = forms.ModelChoiceField(queryset=Template.objects.all(), label="Choose Template")

