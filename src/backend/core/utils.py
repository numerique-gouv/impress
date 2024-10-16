"""
Utilities for the core app.
"""

import base64
import smtplib
from logging import getLogger

from django.conf import settings
from django.contrib.sites.models import Site
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.translation import gettext_lazy as _
from django.utils.translation import override

import y_py as Y
from bs4 import BeautifulSoup

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


def yjs_base64_to_text(base64_string):
    """Extract text from base64 yjs document"""

    decoded_bytes = base64.b64decode(base64_string)
    uint8_array = bytearray(decoded_bytes)

    doc = Y.YDoc()  # pylint: disable=E1101
    Y.apply_update(doc, uint8_array)  # pylint: disable=E1101
    blocknote_structure = str(doc.get_xml_element("document-store"))

    soup = BeautifulSoup(blocknote_structure, "html.parser")
    return soup.get_text(separator=" ").strip()


def text_to_yjs_base64(text: str) -> str:
    """Convert plain text to a base64-encoded Yjs document"""
    doc = Y.YDoc()

    # Insert the paragraph text into the document
    with doc.begin_transaction() as txn:
        xml_fragment = doc.get_xml_element('document-store')

        xml_element = xml_fragment.push_xml_element(txn, 'paragraph')

        xml_text = xml_element.push_xml_text(txn)
        xml_text.push(txn, text)

    # Encode the document as a Uint8Array
    update = Y.encode_state_as_update(doc)

    # Encode the result to base64
    return base64.b64encode(update).decode('utf-8')
