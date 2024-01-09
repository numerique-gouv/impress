from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.core.exceptions import ValidationError


class Command(BaseCommand):
    help = 'Create a superuser with an email and a password'

    def add_arguments(self, parser):
        """Define required arguments "email" and "password"."""
        parser.add_argument(
            "--email",
            help=(
                "Email for the user."
            ),
        )
        parser.add_argument(
            "--password",
            help='Password for the user.',
        )

    def handle(self, *args, **options):
        """
        Given an email and a password, create a superuser or upgrade the existing
        user to superuser status.
        """
        UserModel = get_user_model()
        email = options.get('email')
        try:
            user = UserModel.objects.get(email=email)
        except UserModel.DoesNotExist:
            user = UserModel(email=email)
            message = 'Superuser created successfully.'
        else:
            if user.is_superuser and user.is_staff:
                message = "Superuser already exists."
            else:
                message = "User already existed and was upgraded to superuser."

        user.is_superuser = True
        user.is_staff = True
        user.set_password(options['password'])
        user.save()

        self.stdout.write(self.style.SUCCESS(message))
