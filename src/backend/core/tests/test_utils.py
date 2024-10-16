"""
Unit tests for the Invitation model
"""

import smtplib
from logging import Logger
from unittest import mock

from django.core import mail

import pytest

from core.utils import email_invitation, text_to_yjs_base64, yjs_base64_to_text

pytestmark = pytest.mark.django_db


def test_utils__email_invitation_success():
    """
    The email invitation is sent successfully.
    """
    # pylint: disable-next=no-member
    assert len(mail.outbox) == 0

    email_invitation("en", "guest@example.com", "123-456-789")

    # pylint: disable-next=no-member
    assert len(mail.outbox) == 1

    # pylint: disable-next=no-member
    email = mail.outbox[0]

    assert email.to == ["guest@example.com"]
    email_content = " ".join(email.body.split())
    assert "Invitation to join Docs!" in email_content
    assert "docs/123-456-789/" in email_content


def test_utils__email_invitation_success_fr():
    """
    The email invitation is sent successfully in french.
    """
    # pylint: disable-next=no-member
    assert len(mail.outbox) == 0

    email_invitation("fr-fr", "guest@example.com", "123-456-789")

    # pylint: disable-next=no-member
    assert len(mail.outbox) == 1

    # pylint: disable-next=no-member
    email = mail.outbox[0]

    assert email.to == ["guest@example.com"]
    email_content = " ".join(email.body.split())
    assert "Invitation à rejoindre Docs !" in email_content
    assert "docs/123-456-789/" in email_content


@mock.patch(
    "core.utils.send_mail",
    side_effect=smtplib.SMTPException("Error SMTPException"),
)
@mock.patch.object(Logger, "error")
def test_utils__email_invitation_failed(mock_logger, _mock_send_mail):
    """Check mail behavior when an SMTP error occurs when sent an email invitation."""

    # pylint: disable-next=no-member
    assert len(mail.outbox) == 0

    email_invitation("en", "guest@example.com", "123-456-789")

    # No email has been sent
    # pylint: disable-next=no-member
    assert len(mail.outbox) == 0

    # Logger should be called
    mock_logger.assert_called_once()

    (
        _,
        email,
        exception,
    ) = mock_logger.call_args.args

    assert email == "guest@example.com"
    assert isinstance(exception, smtplib.SMTPException)


def test_yjs_base64_to_text():
    """
    Test extract_text_from_saved_yjs_document
    This base64 string is an example of what is saved in the database.
    This base64 is generated from the blocknote editor, it contains
    the text \n# *Hello* \n- w**or**ld
    """
    base64_string = (
        "AR717vLVDgAHAQ5kb2N1bWVudC1zdG9yZQMKYmxvY2tHcm91cAcA9e7y1Q4AAw5ibG9ja0NvbnRh"
        "aW5lcgcA9e7y1Q4BAwdoZWFkaW5nBwD17vLVDgIGBgD17vLVDgMGaXRhbGljAnt9hPXu8tUOBAVI"
        "ZWxsb4b17vLVDgkGaXRhbGljBG51bGwoAPXu8tUOAg10ZXh0QWxpZ25tZW50AXcEbGVmdCgA9e7y"
        "1Q4CBWxldmVsAX0BKAD17vLVDgECaWQBdyQwNGQ2MjM0MS04MzI2LTQyMzYtYTA4My00ODdlMjZm"
        "YWQyMzAoAPXu8tUOAQl0ZXh0Q29sb3IBdwdkZWZhdWx0KAD17vLVDgEPYmFja2dyb3VuZENvbG9y"
        "AXcHZGVmYXVsdIf17vLVDgEDDmJsb2NrQ29udGFpbmVyBwD17vLVDhADDmJ1bGxldExpc3RJdGVt"
        "BwD17vLVDhEGBAD17vLVDhIBd4b17vLVDhMEYm9sZAJ7fYT17vLVDhQCb3KG9e7y1Q4WBGJvbGQE"
        "bnVsbIT17vLVDhcCbGQoAPXu8tUOEQ10ZXh0QWxpZ25tZW50AXcEbGVmdCgA9e7y1Q4QAmlkAXck"
        "ZDM1MWUwNjgtM2U1NS00MjI2LThlYTUtYWJiMjYzMTk4ZTJhKAD17vLVDhAJdGV4dENvbG9yAXcH"
        "ZGVmYXVsdCgA9e7y1Q4QD2JhY2tncm91bmRDb2xvcgF3B2RlZmF1bHSH9e7y1Q4QAw5ibG9ja0Nv"
        "bnRhaW5lcgcA9e7y1Q4eAwlwYXJhZ3JhcGgoAPXu8tUOHw10ZXh0QWxpZ25tZW50AXcEbGVmdCgA"
        "9e7y1Q4eAmlkAXckODk3MDBjMDctZTBlMS00ZmUwLWFjYTItODQ5MzIwOWE3ZTQyKAD17vLVDh4J"
        "dGV4dENvbG9yAXcHZGVmYXVsdCgA9e7y1Q4eD2JhY2tncm91bmRDb2xvcgF3B2RlZmF1bHQA"
    )

    assert yjs_base64_to_text(base64_string) == "Hello world"


def test_text_to_yjs_base64():
    base64_string = text_to_yjs_base64("Hello world")
    assert yjs_base64_to_text(base64_string) == "Hello world"
