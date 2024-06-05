"""
Test document accesses API endpoints for users in impress's core app.
"""
import random
from uuid import uuid4

import pytest
from rest_framework.test import APIClient

from core import factories, models
from core.api import serializers
from core.tests.conftest import TEAM, USER, VIA

pytestmark = pytest.mark.django_db


def test_api_document_accesses_list_anonymous():
    """Anonymous users should not be allowed to list document accesses."""
    document = factories.DocumentFactory()
    factories.UserDocumentAccessFactory.create_batch(2, document=document)

    response = APIClient().get(f"/api/v1.0/documents/{document.id!s}/accesses/")
    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }


def test_api_document_accesses_list_authenticated_unrelated():
    """
    Authenticated users should not be allowed to list document accesses for a document
    to which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    factories.UserDocumentAccessFactory.create_batch(3, document=document)

    # Accesses for other documents to which the user is related should not be listed either
    other_access = factories.UserDocumentAccessFactory(user=user)
    factories.UserDocumentAccessFactory(document=other_access.document)

    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/accesses/",
    )
    assert response.status_code == 200
    assert response.json() == {
        "count": 0,
        "next": None,
        "previous": None,
        "results": [],
    }


@pytest.mark.parametrize("via", VIA)
def test_api_document_accesses_list_authenticated_related(via, mock_user_get_teams):
    """
    Authenticated users should be able to list document accesses for a document
    to which they are directly related, whatever their role in the document.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        user_access = models.DocumentAccess.objects.create(
            document=document,
            user=user,
            role=random.choice(models.RoleChoices.choices)[0],
        )
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        user_access = models.DocumentAccess.objects.create(
            document=document,
            team="lasuite",
            role=random.choice(models.RoleChoices.choices)[0],
        )

    access1 = factories.TeamDocumentAccessFactory(document=document)
    access2 = factories.UserDocumentAccessFactory(document=document)

    # Accesses for other documents to which the user is related should not be listed either
    other_access = factories.UserDocumentAccessFactory(user=user)
    factories.UserDocumentAccessFactory(document=other_access.document)

    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/accesses/",
    )

    access2_user = serializers.UserSerializer(instance=access2.user).data
    base_user = serializers.UserSerializer(instance=user).data

    assert response.status_code == 200
    content = response.json()
    assert len(content["results"]) == 3
    assert sorted(content["results"], key=lambda x: x["id"]) == sorted(
        [
            {
                "id": str(user_access.id),
                "user": base_user if via == "user" else None,
                "team": "lasuite" if via == "team" else "",
                "role": user_access.role,
                "abilities": user_access.get_abilities(user),
            },
            {
                "id": str(access1.id),
                "user": None,
                "team": access1.team,
                "role": access1.role,
                "abilities": access1.get_abilities(user),
            },
            {
                "id": str(access2.id),
                "user": access2_user,
                "team": "",
                "role": access2.role,
                "abilities": access2.get_abilities(user),
            },
        ],
        key=lambda x: x["id"],
    )


def test_api_document_accesses_retrieve_anonymous():
    """
    Anonymous users should not be allowed to retrieve a document access.
    """
    access = factories.UserDocumentAccessFactory()

    response = APIClient().get(
        f"/api/v1.0/documents/{access.document_id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }


def test_api_document_accesses_retrieve_authenticated_unrelated():
    """
    Authenticated users should not be allowed to retrieve a document access for
    a document to which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    access = factories.UserDocumentAccessFactory(document=document)

    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/accesses/{access.id!s}/",
    )
    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }

    # Accesses related to another document should be excluded even if the user is related to it
    for access in [
        factories.UserDocumentAccessFactory(),
        factories.UserDocumentAccessFactory(user=user),
    ]:
        response = client.get(
            f"/api/v1.0/documents/{document.id!s}/accesses/{access.id!s}/",
        )

        assert response.status_code == 404
        assert response.json() == {"detail": "Not found."}


@pytest.mark.parametrize("via", VIA)
def test_api_document_accesses_retrieve_authenticated_related(via, mock_user_get_teams):
    """
    A user who is related to a document should be allowed to retrieve the
    associated document user accesses.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user)
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(document=document, team="lasuite")

    access = factories.UserDocumentAccessFactory(document=document)

    response = client.get(
        f"/api/v1.0/documents/{document.id!s}/accesses/{access.id!s}/",
    )

    access_user = serializers.UserSerializer(instance=access.user).data

    assert response.status_code == 200
    assert response.json() == {
        "id": str(access.id),
        "user": access_user,
        "team": "",
        "role": access.role,
        "abilities": access.get_abilities(user),
    }


def test_api_document_accesses_create_anonymous():
    """Anonymous users should not be allowed to create document accesses."""
    user = factories.UserFactory()
    document = factories.DocumentFactory()

    response = APIClient().post(
        f"/api/v1.0/documents/{document.id!s}/accesses/",
        {
            "user": str(user.id),
            "document": str(document.id),
            "role": random.choice(models.RoleChoices.choices)[0],
        },
        format="json",
    )

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }
    assert models.DocumentAccess.objects.exists() is False


def test_api_document_accesses_create_authenticated_unrelated():
    """
    Authenticated users should not be allowed to create document accesses for a document to
    which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    other_user = factories.UserFactory()
    document = factories.DocumentFactory()

    response = client.post(
        f"/api/v1.0/documents/{document.id!s}/accesses/",
        {
            "user": str(other_user.id),
        },
        format="json",
    )

    assert response.status_code == 403
    assert not models.DocumentAccess.objects.filter(user=other_user).exists()


@pytest.mark.parametrize("role", ["reader", "editor"])
@pytest.mark.parametrize("via", VIA)
def test_api_document_accesses_create_authenticated_reader_or_editor(
    via, role, mock_user_get_teams
):
    """Readers or editors of a document should not be allowed to create document accesses."""
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role=role)
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role=role
        )

    other_user = factories.UserFactory()

    for new_role in [role[0] for role in models.RoleChoices.choices]:
        response = client.post(
            f"/api/v1.0/documents/{document.id!s}/accesses/",
            {
                "user": str(other_user.id),
                "role": new_role,
            },
            format="json",
        )

        assert response.status_code == 403

    assert not models.DocumentAccess.objects.filter(user=other_user).exists()


@pytest.mark.parametrize("via", VIA)
def test_api_document_accesses_create_authenticated_administrator(
    via, mock_user_get_teams
):
    """
    Administrators of a document should be able to create document accesses
    except for the "owner" role.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(
            document=document, user=user, role="administrator"
        )
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role="administrator"
        )

    other_user = factories.UserFactory()

    # It should not be allowed to create an owner access
    response = client.post(
        f"/api/v1.0/documents/{document.id!s}/accesses/",
        {
            "user": str(other_user.id),
            "role": "owner",
        },
        format="json",
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "Only owners of a resource can assign other users as owners."
    }

    # It should be allowed to create a lower access
    role = random.choice(
        [role[0] for role in models.RoleChoices.choices if role[0] != "owner"]
    )

    response = client.post(
        f"/api/v1.0/documents/{document.id!s}/accesses/",
        {
            "user_id": str(other_user.id),
            "role": role,
        },
        format="json",
    )

    assert response.status_code == 201
    assert models.DocumentAccess.objects.filter(user=other_user).count() == 1
    new_document_access = models.DocumentAccess.objects.filter(user=other_user).get()
    other_user = serializers.UserSerializer(instance=other_user).data
    assert response.json() == {
        "abilities": new_document_access.get_abilities(user),
        "id": str(new_document_access.id),
        "team": "",
        "role": role,
        "user": other_user,
    }


@pytest.mark.parametrize("via", VIA)
def test_api_document_accesses_create_authenticated_owner(via, mock_user_get_teams):
    """
    Owners of a document should be able to create document accesses whatever the role.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role="owner")
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role="owner"
        )

    other_user = factories.UserFactory()

    role = random.choice([role[0] for role in models.RoleChoices.choices])

    response = client.post(
        f"/api/v1.0/documents/{document.id!s}/accesses/",
        {
            "user_id": str(other_user.id),
            "role": role,
        },
        format="json",
    )

    assert response.status_code == 201
    assert models.DocumentAccess.objects.filter(user=other_user).count() == 1
    new_document_access = models.DocumentAccess.objects.filter(user=other_user).get()
    other_user = serializers.UserSerializer(instance=other_user).data
    assert response.json() == {
        "id": str(new_document_access.id),
        "user": other_user,
        "team": "",
        "role": role,
        "abilities": new_document_access.get_abilities(user),
    }


def test_api_document_accesses_update_anonymous():
    """Anonymous users should not be allowed to update a document access."""
    access = factories.UserDocumentAccessFactory()
    old_values = serializers.DocumentAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user": factories.UserFactory().id,
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    api_client = APIClient()
    for field, value in new_values.items():
        response = api_client.put(
            f"/api/v1.0/documents/{access.document_id!s}/accesses/{access.id!s}/",
            {**old_values, field: value},
            format="json",
        )
        assert response.status_code == 401

    access.refresh_from_db()
    updated_values = serializers.DocumentAccessSerializer(instance=access).data
    assert updated_values == old_values


def test_api_document_accesses_update_authenticated_unrelated():
    """
    Authenticated users should not be allowed to update a document access for a document to which
    they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    access = factories.UserDocumentAccessFactory()
    old_values = serializers.DocumentAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user": factories.UserFactory().id,
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    for field, value in new_values.items():
        response = client.put(
            f"/api/v1.0/documents/{access.document_id!s}/accesses/{access.id!s}/",
            {**old_values, field: value},
            format="json",
        )
        assert response.status_code == 403

    access.refresh_from_db()
    updated_values = serializers.DocumentAccessSerializer(instance=access).data
    assert updated_values == old_values


@pytest.mark.parametrize("role", ["reader", "editor"])
@pytest.mark.parametrize("via", VIA)
def test_api_document_accesses_update_authenticated_reader_or_editor(
    via, role, mock_user_get_teams
):
    """Readers or editors of a document should not be allowed to update its accesses."""
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role=role)
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role=role
        )

    access = factories.UserDocumentAccessFactory(document=document)
    old_values = serializers.DocumentAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user": factories.UserFactory().id,
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    for field, value in new_values.items():
        response = client.put(
            f"/api/v1.0/documents/{access.document_id!s}/accesses/{access.id!s}/",
            {**old_values, field: value},
            format="json",
        )
        assert response.status_code == 403

    access.refresh_from_db()
    updated_values = serializers.DocumentAccessSerializer(instance=access).data
    assert updated_values == old_values


@pytest.mark.parametrize("via", VIA)
def test_api_document_accesses_update_administrator_except_owner(
    via, mock_user_get_teams
):
    """
    A user who is a direct administrator in a document should be allowed to update a user
    access for this document, as long as they don't try to set the role to owner.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(
            document=document, user=user, role="administrator"
        )
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role="administrator"
        )

    access = factories.UserDocumentAccessFactory(
        document=document,
        role=random.choice(["administrator", "editor", "reader"]),
    )
    old_values = serializers.DocumentAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user_id": factories.UserFactory().id,
        "role": random.choice(["administrator", "editor", "reader"]),
    }

    for field, value in new_values.items():
        new_data = {**old_values, field: value}
        response = client.put(
            f"/api/v1.0/documents/{document.id!s}/accesses/{access.id!s}/",
            data=new_data,
            format="json",
        )

        if (
            new_data["role"] == old_values["role"]
        ):  # we are not really updating the role
            assert response.status_code == 403
        else:
            assert response.status_code == 200

        access.refresh_from_db()
        updated_values = serializers.DocumentAccessSerializer(instance=access).data
        if field == "role":
            assert updated_values == {**old_values, "role": new_values["role"]}
        else:
            assert updated_values == old_values


@pytest.mark.parametrize("via", VIA)
def test_api_document_accesses_update_administrator_from_owner(
    via, mock_user_get_teams
):
    """
    A user who is an administrator in a document, should not be allowed to update
    the user access of an "owner" for this document.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(
            document=document, user=user, role="administrator"
        )
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role="administrator"
        )

    other_user = factories.UserFactory()
    access = factories.UserDocumentAccessFactory(
        document=document, user=other_user, role="owner"
    )
    old_values = serializers.DocumentAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user_id": factories.UserFactory().id,
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    for field, value in new_values.items():
        response = client.put(
            f"/api/v1.0/documents/{document.id!s}/accesses/{access.id!s}/",
            data={**old_values, field: value},
            format="json",
        )

        assert response.status_code == 403
        access.refresh_from_db()
        updated_values = serializers.DocumentAccessSerializer(instance=access).data
        assert updated_values == old_values


@pytest.mark.parametrize("via", VIA)
def test_api_document_accesses_update_administrator_to_owner(via, mock_user_get_teams):
    """
    A user who is an administrator in a document, should not be allowed to update
    the user access of another user to grant document ownership.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(
            document=document, user=user, role="administrator"
        )
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role="administrator"
        )

    other_user = factories.UserFactory()
    access = factories.UserDocumentAccessFactory(
        document=document,
        user=other_user,
        role=random.choice(["administrator", "editor", "reader"]),
    )
    old_values = serializers.DocumentAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user_id": factories.UserFactory().id,
        "role": "owner",
    }

    for field, value in new_values.items():
        new_data = {**old_values, field: value}
        response = client.put(
            f"/api/v1.0/documents/{document.id!s}/accesses/{access.id!s}/",
            data=new_data,
            format="json",
        )
        # We are not allowed or not really updating the role
        if field == "role" or new_data["role"] == old_values["role"]:
            assert response.status_code == 403
        else:
            assert response.status_code == 200

        access.refresh_from_db()
        updated_values = serializers.DocumentAccessSerializer(instance=access).data
        assert updated_values == old_values


@pytest.mark.parametrize("via", VIA)
def test_api_document_accesses_update_owner(via, mock_user_get_teams):
    """
    A user who is an owner in a document should be allowed to update
    a user access for this document whatever the role.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role="owner")
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role="owner"
        )

    factories.UserFactory()
    access = factories.UserDocumentAccessFactory(
        document=document,
    )
    old_values = serializers.DocumentAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user_id": factories.UserFactory().id,
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    for field, value in new_values.items():
        new_data = {**old_values, field: value}
        response = client.put(
            f"/api/v1.0/documents/{document.id!s}/accesses/{access.id!s}/",
            data=new_data,
            format="json",
        )

        if (
            new_data["role"] == old_values["role"]
        ):  # we are not really updating the role
            assert response.status_code == 403
        else:
            assert response.status_code == 200

        access.refresh_from_db()
        updated_values = serializers.DocumentAccessSerializer(instance=access).data

        if field == "role":
            assert updated_values == {**old_values, "role": new_values["role"]}
        else:
            assert updated_values == old_values


@pytest.mark.parametrize("via", VIA)
def test_api_document_accesses_update_owner_self(via, mock_user_get_teams):
    """
    A user who is owner of a document should be allowed to update
    their own user access provided there are other owners in the document.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        access = factories.UserDocumentAccessFactory(
            document=document, user=user, role="owner"
        )
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        access = factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role="owner"
        )

    old_values = serializers.DocumentAccessSerializer(instance=access).data
    new_role = random.choice(["administrator", "editor", "reader"])

    response = client.put(
        f"/api/v1.0/documents/{document.id!s}/accesses/{access.id!s}/",
        data={**old_values, "role": new_role},
        format="json",
    )

    assert response.status_code == 403
    access.refresh_from_db()
    assert access.role == "owner"

    # Add another owner and it should now work
    factories.UserDocumentAccessFactory(document=document, role="owner")

    response = client.put(
        f"/api/v1.0/documents/{document.id!s}/accesses/{access.id!s}/",
        data={
            **old_values,
            "role": new_role,
            "user_id": old_values.get("user", {}).get("id")
            if old_values.get("user") is not None
            else None,
        },
        format="json",
    )

    assert response.status_code == 200
    access.refresh_from_db()
    assert access.role == new_role


# Delete


def test_api_document_accesses_delete_anonymous():
    """Anonymous users should not be allowed to destroy a document access."""
    access = factories.UserDocumentAccessFactory()

    response = APIClient().delete(
        f"/api/v1.0/documents/{access.document_id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 401
    assert models.DocumentAccess.objects.count() == 1


def test_api_document_accesses_delete_authenticated():
    """
    Authenticated users should not be allowed to delete a document access for a
    document to which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    access = factories.UserDocumentAccessFactory()

    response = client.delete(
        f"/api/v1.0/documents/{access.document_id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 403
    assert models.DocumentAccess.objects.count() == 1


@pytest.mark.parametrize("role", ["reader", "editor"])
@pytest.mark.parametrize("via", VIA)
def test_api_document_accesses_delete_reader_or_editor(via, role, mock_user_get_teams):
    """
    Authenticated users should not be allowed to delete a document access for a
    document in which they are a simple reader or editor.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role=role)
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role=role
        )

    access = factories.UserDocumentAccessFactory(document=document)

    assert models.DocumentAccess.objects.count() == 2
    assert models.DocumentAccess.objects.filter(user=access.user).exists()

    response = client.delete(
        f"/api/v1.0/documents/{document.id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 403
    assert models.DocumentAccess.objects.count() == 2


@pytest.mark.parametrize("via", VIA)
def test_api_document_accesses_delete_administrators_except_owners(
    via, mock_user_get_teams
):
    """
    Users who are administrators in a document should be allowed to delete an access
    from the document provided it is not ownership.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(
            document=document, user=user, role="administrator"
        )
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role="administrator"
        )

    access = factories.UserDocumentAccessFactory(
        document=document, role=random.choice(["reader", "editor", "administrator"])
    )

    assert models.DocumentAccess.objects.count() == 2
    assert models.DocumentAccess.objects.filter(user=access.user).exists()

    response = client.delete(
        f"/api/v1.0/documents/{document.id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 204
    assert models.DocumentAccess.objects.count() == 1


@pytest.mark.parametrize("via", VIA)
def test_api_document_accesses_delete_administrator_on_owners(via, mock_user_get_teams):
    """
    Users who are administrators in a document should not be allowed to delete an ownership
    access from the document.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(
            document=document, user=user, role="administrator"
        )
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role="administrator"
        )

    access = factories.UserDocumentAccessFactory(document=document, role="owner")

    assert models.DocumentAccess.objects.count() == 2
    assert models.DocumentAccess.objects.filter(user=access.user).exists()

    response = client.delete(
        f"/api/v1.0/documents/{document.id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 403
    assert models.DocumentAccess.objects.count() == 2


@pytest.mark.parametrize("via", VIA)
def test_api_document_accesses_delete_owners(via, mock_user_get_teams):
    """
    Users should be able to delete the document access of another user
    for a document of which they are owner.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        factories.UserDocumentAccessFactory(document=document, user=user, role="owner")
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role="owner"
        )

    access = factories.UserDocumentAccessFactory(document=document)

    assert models.DocumentAccess.objects.count() == 2
    assert models.DocumentAccess.objects.filter(user=access.user).exists()

    response = client.delete(
        f"/api/v1.0/documents/{document.id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 204
    assert models.DocumentAccess.objects.count() == 1


@pytest.mark.parametrize("via", VIA)
def test_api_document_accesses_delete_owners_last_owner(via, mock_user_get_teams):
    """
    It should not be possible to delete the last owner access from a document
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    document = factories.DocumentFactory()
    if via == USER:
        access = factories.UserDocumentAccessFactory(
            document=document, user=user, role="owner"
        )
    elif via == TEAM:
        mock_user_get_teams.return_value = ["lasuite", "unknown"]
        access = factories.TeamDocumentAccessFactory(
            document=document, team="lasuite", role="owner"
        )

    assert models.DocumentAccess.objects.count() == 1
    response = client.delete(
        f"/api/v1.0/documents/{document.id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 403
    assert models.DocumentAccess.objects.count() == 1
