# Generated by Django 5.0.3 on 2024-05-28 20:29

import django.contrib.auth.models
import django.core.validators
import django.db.models.deletion
import timezone_field.fields
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Document',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='primary key for the record as UUID', primary_key=True, serialize=False, verbose_name='id')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='date and time at which a record was created', verbose_name='created on')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='date and time at which a record was last updated', verbose_name='updated on')),
                ('title', models.CharField(max_length=255, verbose_name='title')),
                ('is_public', models.BooleanField(default=False, help_text='Whether this document is public for anyone to use.', verbose_name='public')),
            ],
            options={
                'verbose_name': 'Document',
                'verbose_name_plural': 'Documents',
                'db_table': 'impress_document',
                'ordering': ('title',),
            },
        ),
        migrations.CreateModel(
            name='Template',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='primary key for the record as UUID', primary_key=True, serialize=False, verbose_name='id')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='date and time at which a record was created', verbose_name='created on')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='date and time at which a record was last updated', verbose_name='updated on')),
                ('title', models.CharField(max_length=255, verbose_name='title')),
                ('description', models.TextField(blank=True, verbose_name='description')),
                ('code', models.TextField(blank=True, verbose_name='code')),
                ('css', models.TextField(blank=True, verbose_name='css')),
                ('is_public', models.BooleanField(default=False, help_text='Whether this template is public for anyone to use.', verbose_name='public')),
            ],
            options={
                'verbose_name': 'Template',
                'verbose_name_plural': 'Templates',
                'db_table': 'impress_template',
                'ordering': ('title',),
            },
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='primary key for the record as UUID', primary_key=True, serialize=False, verbose_name='id')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='date and time at which a record was created', verbose_name='created on')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='date and time at which a record was last updated', verbose_name='updated on')),
                ('sub', models.CharField(blank=True, help_text='Required. 255 characters or fewer. Letters, numbers, and @/./+/-/_ characters only.', max_length=255, null=True, unique=True, validators=[django.core.validators.RegexValidator(message='Enter a valid sub. This value may contain only letters, numbers, and @/./+/-/_ characters.', regex='^[\\w.@+-]+\\Z')], verbose_name='sub')),
                ('email', models.EmailField(blank=True, max_length=254, null=True, verbose_name='identity email address')),
                ('admin_email', models.EmailField(blank=True, max_length=254, null=True, unique=True, verbose_name='admin email address')),
                ('language', models.CharField(choices="(('en-us', 'English'), ('fr-fr', 'French'))", default='en-us', help_text='The language in which the user wants to see the interface.', max_length=10, verbose_name='language')),
                ('timezone', timezone_field.fields.TimeZoneField(choices_display='WITH_GMT_OFFSET', default='UTC', help_text='The timezone in which the user wants to see times.', use_pytz=False)),
                ('is_device', models.BooleanField(default=False, help_text='Whether the user is a device or a real user.', verbose_name='device')),
                ('is_staff', models.BooleanField(default=False, help_text='Whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'user',
                'verbose_name_plural': 'users',
                'db_table': 'impress_user',
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='DocumentAccess',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='primary key for the record as UUID', primary_key=True, serialize=False, verbose_name='id')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='date and time at which a record was created', verbose_name='created on')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='date and time at which a record was last updated', verbose_name='updated on')),
                ('team', models.CharField(blank=True, max_length=100)),
                ('role', models.CharField(choices=[('reader', 'Reader'), ('editor', 'Editor'), ('administrator', 'Administrator'), ('owner', 'Owner')], default='reader', max_length=20)),
                ('document', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='accesses', to='core.document')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Document/user relation',
                'verbose_name_plural': 'Document/user relations',
                'db_table': 'impress_document_access',
                'ordering': ('-created_at',),
            },
        ),
        migrations.CreateModel(
            name='Invitation',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='primary key for the record as UUID', primary_key=True, serialize=False, verbose_name='id')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='date and time at which a record was created', verbose_name='created on')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='date and time at which a record was last updated', verbose_name='updated on')),
                ('email', models.EmailField(max_length=254, verbose_name='email address')),
                ('role', models.CharField(choices=[('reader', 'Reader'), ('editor', 'Editor'), ('administrator', 'Administrator'), ('owner', 'Owner')], default='reader', max_length=20)),
                ('document', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='invitations', to='core.document')),
                ('issuer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='invitations', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Document invitation',
                'verbose_name_plural': 'Document invitations',
                'db_table': 'impress_invitation',
            },
        ),
        migrations.CreateModel(
            name='TemplateAccess',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='primary key for the record as UUID', primary_key=True, serialize=False, verbose_name='id')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='date and time at which a record was created', verbose_name='created on')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='date and time at which a record was last updated', verbose_name='updated on')),
                ('team', models.CharField(blank=True, max_length=100)),
                ('role', models.CharField(choices=[('reader', 'Reader'), ('editor', 'Editor'), ('administrator', 'Administrator'), ('owner', 'Owner')], default='reader', max_length=20)),
                ('template', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='accesses', to='core.template')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Template/user relation',
                'verbose_name_plural': 'Template/user relations',
                'db_table': 'impress_template_access',
                'ordering': ('-created_at',),
            },
        ),
        migrations.AddConstraint(
            model_name='documentaccess',
            constraint=models.UniqueConstraint(condition=models.Q(('user__isnull', False)), fields=('user', 'document'), name='unique_document_user', violation_error_message='This user is already in this document.'),
        ),
        migrations.AddConstraint(
            model_name='documentaccess',
            constraint=models.UniqueConstraint(condition=models.Q(('team__gt', '')), fields=('team', 'document'), name='unique_document_team', violation_error_message='This team is already in this document.'),
        ),
        migrations.AddConstraint(
            model_name='documentaccess',
            constraint=models.CheckConstraint(condition=models.Q(models.Q(('team', ''), ('user__isnull', False)), models.Q(('team__gt', ''), ('user__isnull', True)), _connector='OR'), name='check_document_access_either_user_or_team', violation_error_message='Either user or team must be set, not both.'),
        ),
        migrations.AddConstraint(
            model_name='invitation',
            constraint=models.UniqueConstraint(fields=('email', 'document'), name='email_and_document_unique_together'),
        ),
        migrations.AddConstraint(
            model_name='templateaccess',
            constraint=models.UniqueConstraint(condition=models.Q(('user__isnull', False)), fields=('user', 'template'), name='unique_template_user', violation_error_message='This user is already in this template.'),
        ),
        migrations.AddConstraint(
            model_name='templateaccess',
            constraint=models.UniqueConstraint(condition=models.Q(('team__gt', '')), fields=('team', 'template'), name='unique_template_team', violation_error_message='This team is already in this template.'),
        ),
        migrations.AddConstraint(
            model_name='templateaccess',
            constraint=models.CheckConstraint(condition=models.Q(models.Q(('team', ''), ('user__isnull', False)), models.Q(('team__gt', ''), ('user__isnull', True)), _connector='OR'), name='check_template_access_either_user_or_team', violation_error_message='Either user or team must be set, not both.'),
        ),
    ]
