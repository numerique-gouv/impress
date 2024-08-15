"""
Unit tests for the Invitation model
"""
import random
import time

from django.core import mail

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from core import factories, models
from core.tests.conftest import TEAM, USER, VIA

pytestmark = pytest.mark.django_db


def test_api_document_invitations__create__anonymous():
    """Anonymous users should not be able to create invitations."""
    document = factories.DocumentFactory()
    invitation_values = {
        "email": "guest@example.com",
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    response = APIClient().post(
        f"/api/v1.0/documents/{document.id}/invitations/",
        invitation_values,
        format="json",
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }


def test_api_document_invitations__create__authenticated_outsider():
    """Users outside of document should not be permitted to invite to document."""
    user = factories.UserFactory()
    document = factories.DocumentFactory()
    invitation_values = {
        "email": "guest@example.com",
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    client = APIClient()
    client.force_login(user)
    response = client.post(
        f"/api/v1.0/documents/{document.id}/invitations/",
        invitation_values,
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.parametrize(
    "inviting,invited,is_allowed",
    (
        ["reader", "reader", False],
        ["reader", "editor", False],
        ["reader", "administrator", False],
        ["reader", "owner", False],
        ["editor", "reader", False],
        ["editor", "editor", False],
        ["editor", "administrator", False],
        ["editor", "owner", False],
        ["administrator", "reader", True],
        ["administrator", "editor", True],
        ["administrator", "administrator", True],
        ["administrator", "owner", False],
        ["owner", "reader", True],
        ["owner", "editor", True],
        ["owner", "administrator", True],
        ["owner", "owner", True],
    ),
)
@pytest.mark.parametrize("via", VIA)
def test_api_document_invitations__create__privileged_members(
    via, inviting, invited, is_allowed, mock_user_get_teams
):
    """
    Only owners and administrators should be able to invite new users.
    Only owners can invite owners.
    """
    user = factories.UserFactory()
    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role=inviting)
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role=inviting
        )

    invitation_values = {
        "email": "guest@example.com",
        "role": invited,
    }

    assert len(mail.outbox) == 0

    client = APIClient()
    client.force_login(user)
    response = client.post(
        f"/api/v1.0/documents/{document.id}/invitations/",
        invitation_values,
        format="json",
    )
    if is_allowed:
        assert response.status_code == status.HTTP_201_CREATED
        assert models.Invitation.objects.count() == 1

        assert len(mail.outbox) == 1
        email = mail.outbox[0]
        assert email.to == ["guest@example.com"]
        email_content = " ".join(email.body.split())
        assert "Invitation to join Docs!" in email_content
    else:
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert models.Invitation.objects.exists() is False


def test_api_document_invitations__create__email_from_content_language():
    """
    The email generated is from the language set in the Content-Language header
    """
    user = factories.UserFactory()
    document = factories.DocumentFactory()
    factories.UserDocumentAccessFactory(document=document, user=user, role="owner")

    invitation_values = {
        "email": "guest@example.com",
        "role": "reader",
    }

    assert len(mail.outbox) == 0

    client = APIClient()
    client.force_login(user)
    response = client.post(
        f"/api/v1.0/documents/{document.id}/invitations/",
        invitation_values,
        format="json",
        headers={"Content-Language": "fr-fr"},
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["email"] == "guest@example.com"
    assert models.Invitation.objects.count() == 1
    assert len(mail.outbox) == 1

    email = mail.outbox[0]

    assert email.to == ["guest@example.com"]

    email_content = " ".join(email.body.split())
    assert "Invitation à rejoindre Docs !" in email_content


def test_api_document_invitations__create__email_from_content_language_not_supported():
    """
    If the language from the Content-Language is not supported
    it will display the default language, English.
    """
    user = factories.UserFactory()
    document = factories.DocumentFactory()
    factories.UserDocumentAccessFactory(document=document, user=user, role="owner")

    invitation_values = {
        "email": "guest@example.com",
        "role": "reader",
    }

    assert len(mail.outbox) == 0

    client = APIClient()
    client.force_login(user)
    response = client.post(
        f"/api/v1.0/documents/{document.id}/invitations/",
        invitation_values,
        format="json",
        headers={"Content-Language": "not-supported"},
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["email"] == "guest@example.com"
    assert models.Invitation.objects.count() == 1
    assert len(mail.outbox) == 1

    email = mail.outbox[0]

    assert email.to == ["guest@example.com"]

    email_content = " ".join(email.body.split())
    assert "Invitation to join Docs!" in email_content


def test_api_document_invitations__create__issuer_and_document_override():
    """It should not be possible to set the "document" and "issuer" fields."""
    user = factories.UserFactory()
    document = factories.DocumentFactory(users=[(user, "owner")])
    other_document = factories.DocumentFactory(users=[(user, "owner")])
    invitation_values = {
        "document": str(other_document.id),
        "issuer": str(factories.UserFactory().id),
        "email": "guest@example.com",
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    client = APIClient()
    client.force_login(user)
    response = client.post(
        f"/api/v1.0/documents/{document.id}/invitations/",
        invitation_values,
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    # document and issuer automatically set
    assert response.json()["document"] == str(document.id)
    assert response.json()["issuer"] == str(user.id)


def test_api_document_invitations__create__cannot_duplicate_invitation():
    """An email should not be invited multiple times to the same document."""
    existing_invitation = factories.InvitationFactory()
    document = existing_invitation.document

    # Grant privileged role on the Document to the user
    user = factories.UserFactory()
    models.DocumentAccess.objects.create(
        document=document, user=user, role="administrator"
    )

    # Create a new invitation to the same document with the exact same email address
    invitation_values = {
        "email": existing_invitation.email,
        "role": random.choice(["administrator", "editor", "reader"]),
    }

    client = APIClient()
    client.force_login(user)
    response = client.post(
        f"/api/v1.0/documents/{document.id}/invitations/",
        invitation_values,
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["__all__"] == [
        "Document invitation with this Email address and Document already exists."
    ]


def test_api_document_invitations__create__cannot_invite_existing_users():
    """
    It should not be possible to invite already existing users.
    """
    user = factories.UserFactory()
    document = factories.DocumentFactory(users=[(user, "owner")])
    existing_user = factories.UserFactory()

    # Build an invitation to the email of an exising identity in the db
    invitation_values = {
        "email": existing_user.email,
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    client = APIClient()
    client.force_login(user)
    response = client.post(
        f"/api/v1.0/documents/{document.id}/invitations/",
        invitation_values,
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["email"] == [
        "This email is already associated to a registered user."
    ]


def test_api_document_invitations__list__anonymous_user():
    """Anonymous users should not be able to list invitations."""
    document = factories.DocumentFactory()
    response = APIClient().get(f"/api/v1.0/documents/{document.id}/invitations/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.parametrize("via", VIA)
def test_api_document_invitations__list__authenticated(
    via, mock_user_get_teams, django_assert_num_queries
):
    """
    Authenticated users should be able to list invitations for documents to which they are
    related, whatever the role and including invitations issued by other users.
    """
    user = factories.UserFactory()
    other_user = factories.UserFactory()
    document = factories.DocumentFactory()
    role = random.choice(models.RoleChoices.choices)[0]
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role=role)
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role=role
        )

    invitation = factories.InvitationFactory(
        document=document, role="administrator", issuer=user
    )
    other_invitations = factories.InvitationFactory.create_batch(
        2, document=document, role="reader", issuer=other_user
    )

    # invitations from other documents should not be listed
    other_document = factories.DocumentFactory()
    factories.InvitationFactory.create_batch(2, document=other_document, role="reader")

    client = APIClient()
    client.force_login(user)
    with django_assert_num_queries(3):
        response = client.get(
            f"/api/v1.0/documents/{document.id}/invitations/",
        )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["count"] == 3
    assert sorted(response.json()["results"], key=lambda x: x["created_at"]) == sorted(
        [
            {
                "id": str(i.id),
                "created_at": i.created_at.isoformat().replace("+00:00", "Z"),
                "email": str(i.email),
                "document": str(document.id),
                "role": i.role,
                "issuer": str(i.issuer.id),
                "is_expired": False,
                "abilities": {
                    "destroy": role in ["administrator", "owner"],
                    "update": False,
                    "partial_update": False,
                    "retrieve": True,
                },
            }
            for i in [invitation, *other_invitations]
        ],
        key=lambda x: x["created_at"],
    )


def test_api_document_invitations__list__expired_invitations_still_listed(settings):
    """
    Expired invitations are still listed.
    """
    user = factories.UserFactory()
    other_user = factories.UserFactory()

    document = factories.DocumentFactory(
        users=[(user, "administrator"), (other_user, "owner")]
    )

    # override settings to accelerate validation expiration
    settings.INVITATION_VALIDITY_DURATION = 1  # second
    expired_invitation = factories.InvitationFactory(
        document=document,
        role="reader",
        issuer=user,
    )
    time.sleep(1)

    client = APIClient()
    client.force_login(user)
    response = client.get(
        f"/api/v1.0/documents/{document.id}/invitations/",
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["count"] == 1
    assert sorted(response.json()["results"], key=lambda x: x["created_at"]) == sorted(
        [
            {
                "id": str(expired_invitation.id),
                "created_at": expired_invitation.created_at.isoformat().replace(
                    "+00:00", "Z"
                ),
                "email": str(expired_invitation.email),
                "document": str(document.id),
                "role": expired_invitation.role,
                "issuer": str(expired_invitation.issuer.id),
                "is_expired": True,
                "abilities": {
                    "destroy": True,
                    "update": False,
                    "partial_update": False,
                    "retrieve": True,
                },
            },
        ],
        key=lambda x: x["created_at"],
    )


def test_api_document_invitations__retrieve__anonymous_user():
    """
    Anonymous users should not be able to retrieve invitations.
    """

    invitation = factories.InvitationFactory()
    response = APIClient().get(
        f"/api/v1.0/documents/{invitation.document.id}/invitations/{invitation.id}/",
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_api_document_invitations__retrieve__unrelated_user():
    """
    Authenticated unrelated users should not be able to retrieve invitations.
    """
    user = factories.UserFactory()
    invitation = factories.InvitationFactory()

    client = APIClient()
    client.force_login(user)
    response = client.get(
        f"/api/v1.0/documents/{invitation.document.id!s}/invitations/{invitation.id!s}/",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.parametrize("via", VIA)
def test_api_document_invitations__retrieve__document_member(via, mock_user_get_teams):
    """
    Authenticated users related to the document should be able to retrieve invitations
    whatever their role in the document.
    """
    user = factories.UserFactory()
    invitation = factories.InvitationFactory()
    role = random.choice(models.RoleChoices.choices)[0]
    if via == USER:
        factories.UserDocumentAccessFactory(
            document=invitation.document, user=user, role=role
        )
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=invitation.document, team="lasuite", role=role
        )

    client = APIClient()
    client.force_login(user)
    response = client.get(
        f"/api/v1.0/documents/{invitation.document.id}/invitations/{invitation.id}/",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "id": str(invitation.id),
        "created_at": invitation.created_at.isoformat().replace("+00:00", "Z"),
        "email": invitation.email,
        "document": str(invitation.document.id),
        "role": str(invitation.role),
        "issuer": str(invitation.issuer.id),
        "is_expired": False,
        "abilities": {
            "destroy": role in ["administrator", "owner"],
            "update": False,
            "partial_update": False,
            "retrieve": True,
        },
    }


@pytest.mark.parametrize("via", VIA)
@pytest.mark.parametrize(
    "method",
    ["put", "patch"],
)
def test_api_document_invitations__update__forbidden(method, via, mock_user_get_teams):
    """
    Update of invitations is currently forbidden.
    """
    user = factories.UserFactory()
    invitation = factories.InvitationFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(
            document=invitation.document, user=user, role="owner"
        )
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=invitation.document, team="lasuite", role="owner"
        )

    client = APIClient()
    client.force_login(user)
    url = f"/api/v1.0/documents/{invitation.document.id}/invitations/{invitation.id}/"
    if method == "put":
        response = client.put(url)
    if method == "patch":
        response = client.patch(url)

    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert response.json()["detail"] == f'Method "{method.upper()}" not allowed.'


def test_api_document_invitations__delete__anonymous():
    """Anonymous user should not be able to delete invitations."""
    invitation = factories.InvitationFactory()

    response = APIClient().delete(
        f"/api/v1.0/documents/{invitation.document.id}/invitations/{invitation.id}/",
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_api_document_invitations__delete__authenticated_outsider():
    """Members unrelated to a document should not be allowed to cancel invitations."""
    user = factories.UserFactory()

    document = factories.DocumentFactory()
    invitation = factories.InvitationFactory(document=document)

    client = APIClient()
    client.force_login(user)
    response = client.delete(
        f"/api/v1.0/documents/{document.id}/invitations/{invitation.id}/",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.parametrize("via", VIA)
@pytest.mark.parametrize("role", ["owner", "administrator"])
def test_api_document_invitations__delete__privileged_members(
    role, via, mock_user_get_teams
):
    """Privileged member should be able to cancel invitation."""
    user = factories.UserFactory()
    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role=role)
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role=role
        )

    invitation = factories.InvitationFactory(document=document)

    client = APIClient()
    client.force_login(user)
    response = client.delete(
        f"/api/v1.0/documents/{document.id}/invitations/{invitation.id}/",
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.parametrize("role", ["reader", "editor"])
@pytest.mark.parametrize("via", VIA)
def test_api_document_invitations_delete_readers_or_editors(
    via, role, mock_user_get_teams
):
    """Readers or editors should not be able to cancel invitation."""
    user = factories.UserFactory()
    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role=role)
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role=role
        )

    invitation = factories.InvitationFactory(document=document)

    client = APIClient()
    client.force_login(user)
    response = client.delete(
        f"/api/v1.0/documents/{document.id}/invitations/{invitation.id}/",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert (
        response.json()["detail"]
        == "You do not have permission to perform this action."
    )
