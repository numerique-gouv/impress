from django.shortcuts import render, HttpResponse
from .forms import DocumentGenerationForm
from .models import Template
from rest_framework import status

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import serializers

from django.http import FileResponse
from io import BytesIO


def generate_document(request):
    if request.method == 'POST':
        form = DocumentGenerationForm(request.POST)
        if form.is_valid():
            # Get the selected template from the form
            template = form.cleaned_data['template']

            # Get the body content from the form
            body = form.cleaned_data['body']

            # Call the generate_document method
            pdf_content = template.generate_document(body)

            # Return the generated PDF as a response for download
            response = HttpResponse(pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename={template.title}.pdf'
            return response
    else:
        form = DocumentGenerationForm()

    return render(request, 'core/generate_document.html', {'form': form})


class DocumentGenerationSerializer(serializers.Serializer):
    body = serializers.CharField(label="Markdown Body")
    template_id = serializers.UUIDField(format='hex_verbose')

class GenerateDocumentAPIView(APIView):
    def post(self, request):
        serializer = DocumentGenerationSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        template_id = serializer.validated_data['template_id']
        body = serializer.validated_data['body']

        try:
            template = Template.objects.get(pk=template_id)
        except Template.DoesNotExist:
            return Response("Template not found", status=status.HTTP_404_NOT_FOUND)

        pdf_content = template.generate_document(body)

        response = FileResponse(BytesIO(pdf_content), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename={template.title}.pdf'
        return response



class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = ['id', 'title']

class TemplatesApiView(APIView):
    """Wip."""

    def get(self, request, *args, **kwargs):
        """Wip."""
        templates = Template.objects.all()
        serializer = TemplateSerializer(templates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



