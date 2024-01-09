from django.contrib.auth.management.commands.createsuperuser import Command as BaseCommand
from django.core.exceptions import ValidationError

class Command(BaseCommand):
    help = 'Create a superuser without a username field'

    def handle(self, *args, **options):
        # Check if a superuser already exists
        try:
            self.UserModel._default_manager.db_manager(options['database']).get(
                is_superuser=True,
            )
        except self.UserModel.DoesNotExist:
            # If not, create a superuser without a username
            email = options.get('email')
            password = options.get('password')
            self.UserModel._default_manager.db_manager(options['database']).create_superuser(
                email=email,
                password=password,
            )
            self.stdout.write(self.style.SUCCESS('Superuser created successfully.'))
        except ValidationError as e:
            self.stderr.write(self.style.ERROR(f'Error creating superuser: {", ".join(e.messages)}'))
