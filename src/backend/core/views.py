from django.shortcuts import render, HttpResponse
from .forms import DocumentGenerationForm
from .models import Template


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

