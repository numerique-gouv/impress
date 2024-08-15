"""
Utilities for the core app.
"""
import smtplib
from logging import getLogger

from django.conf import settings
from django.contrib.sites.models import Site
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.translation import gettext_lazy as _
from django.utils.translation import override

logger = getLogger(__name__)


def email_invitation(language, email, document_id):
    """Send email invitation."""
    try:
        with override(language):
            title = _("Invitation to join Docs!")
            template_vars = {
                "title": title,
                "site": Site.objects.get_current(),
                "document_id": document_id,
            }
            msg_html = render_to_string("mail/html/invitation.html", template_vars)
            msg_plain = render_to_string("mail/text/invitation.txt", template_vars)
            send_mail(
                title,
                msg_plain,
                settings.EMAIL_FROM,
                [email],
                html_message=msg_html,
                fail_silently=False,
            )

    except smtplib.SMTPException as exception:
        logger.error("invitation to %s was not sent: %s", email, exception)
