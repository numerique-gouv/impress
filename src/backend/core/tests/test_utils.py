"""
Unit tests for the Invitation model
"""
import smtplib
from logging import Logger
from unittest import mock

from django.core import mail

import pytest

from core.utils import email_invitation

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
