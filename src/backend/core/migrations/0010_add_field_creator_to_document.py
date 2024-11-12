# Generated by Django 5.1.2 on 2024-11-09 11:36

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0009_add_document_favorite'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='creator',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.RESTRICT, related_name='documents_created', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='user',
            name='language',
            field=models.CharField(choices="(('en-us', 'English'), ('fr-fr', 'French'), ('de-de', 'German'))", default='en-us', help_text='The language in which the user wants to see the interface.', max_length=10, verbose_name='language'),
        ),
        migrations.AlterField(
            model_name='user',
            name='sub',
            field=models.CharField(blank=True, help_text='Required. 255 characters or fewer. Letters, numbers, and @/./+/-/_/: characters only.', max_length=255, null=True, unique=True, validators=[django.core.validators.RegexValidator(message='Enter a valid sub. This value may contain only letters, numbers, and @/./+/-/_/: characters.', regex='^[\\w.@+-:]+\\Z')], verbose_name='sub'),
        ),
    ]
