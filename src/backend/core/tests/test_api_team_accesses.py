"""
Test team accesses API endpoints for users in publish's core app.
"""
import random
from uuid import uuid4

import pytest
from rest_framework.test import APIClient

from core import factories, models
from core.api import serializers

from .utils import OIDCToken

pytestmark = pytest.mark.django_db


def test_api_team_accesses_list_anonymous():
    """Anonymous users should not be allowed to list team accesses."""
    team = factories.TeamFactory()
    factories.TeamAccessFactory.create_batch(2, team=team)

    response = APIClient().get(f"/api/v1.0/teams/{team.id!s}/accesses/")
    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }


def test_api_team_accesses_list_authenticated_unrelated():
    """
    Authenticated users should not be allowed to list team accesses for a team
    to which they are not related.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory()
    factories.TeamAccessFactory.create_batch(3, team=team)

    # Accesses for other teams to which the user is related should not be listed either
    other_access = factories.TeamAccessFactory(user=user)
    factories.TeamAccessFactory(team=other_access.team)

    response = APIClient().get(
        f"/api/v1.0/teams/{team.id!s}/accesses/",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )
    assert response.status_code == 200
    assert response.json() == {
        "count": 0,
        "next": None,
        "previous": None,
        "results": [],
    }


def test_api_team_accesses_list_authenticated_related():
    """
    Authenticated users should be able to list team accesses for a team
    to which they are related, whatever their role in the team.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory()
    user_access = models.TeamAccess.objects.create(team=team, user=user)  # random role
    access1, access2 = factories.TeamAccessFactory.create_batch(2, team=team)

    # Accesses for other teams to which the user is related should not be listed either
    other_access = factories.TeamAccessFactory(user=user)
    factories.TeamAccessFactory(team=other_access.team)

    response = APIClient().get(
        f"/api/v1.0/teams/{team.id!s}/accesses/",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 200
    content = response.json()
    assert len(content["results"]) == 3
    assert sorted(content["results"], key=lambda x: x["id"]) == sorted(
        [
            {
                "id": str(user_access.id),
                "user": str(user.id),
                "role": user_access.role,
                "abilities": user_access.get_abilities(user),
            },
            {
                "id": str(access1.id),
                "user": str(access1.user.id),
                "role": access1.role,
                "abilities": access1.get_abilities(user),
            },
            {
                "id": str(access2.id),
                "user": str(access2.user.id),
                "role": access2.role,
                "abilities": access2.get_abilities(user),
            },
        ],
        key=lambda x: x["id"],
    )


def test_api_team_accesses_retrieve_anonymous():
    """
    Anonymous users should not be allowed to retrieve a team access.
    """
    access = factories.TeamAccessFactory()

    response = APIClient().get(
        f"/api/v1.0/teams/{access.team.id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }


def test_api_team_accesses_retrieve_authenticated_unrelated():
    """
    Authenticated users should not be allowed to retrieve a team access for
    a team to which they are not related.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory()
    access = factories.TeamAccessFactory(team=team)

    response = APIClient().get(
        f"/api/v1.0/teams/{team.id!s}/accesses/{access.id!s}/",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )
    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }

    # Accesses related to another team should be excluded even if the user is related to it
    for access in [
        factories.TeamAccessFactory(),
        factories.TeamAccessFactory(user=user),
    ]:
        response = APIClient().get(
            f"/api/v1.0/teams/{team.id!s}/accesses/{access.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        assert response.status_code == 404
        assert response.json() == {"detail": "Not found."}


def test_api_team_accesses_retrieve_authenticated_related():
    """
    A user who is related to a team should be allowed to retrieve the
    associated team user accesses.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[user])
    access = factories.TeamAccessFactory(team=team)

    response = APIClient().get(
        f"/api/v1.0/teams/{team.id!s}/accesses/{access.id!s}/",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": str(access.id),
        "user": str(access.user.id),
        "role": access.role,
        "abilities": access.get_abilities(user),
    }


def test_api_team_accesses_create_anonymous():
    """Anonymous users should not be allowed to create team accesses."""
    user = factories.UserFactory()
    team = factories.TeamFactory()

    response = APIClient().post(
        f"/api/v1.0/teams/{team.id!s}/accesses/",
        {
            "user": str(user.id),
            "team": str(team.id),
            "role": random.choice(models.RoleChoices.choices)[0],
        },
        format="json",
    )
    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }
    assert models.TeamAccess.objects.exists() is False


def test_api_team_accesses_create_authenticated_unrelated():
    """
    Authenticated users should not be allowed to create team accesses for a team to
    which they are not related.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    other_user = factories.UserFactory()
    team = factories.TeamFactory()

    response = APIClient().post(
        f"/api/v1.0/teams/{team.id!s}/accesses/",
        {
            "user": str(other_user.id),
        },
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "You are not allowed to manage accesses for this team."
    }
    assert not models.TeamAccess.objects.filter(user=other_user).exists()


def test_api_team_accesses_create_authenticated_member():
    """Members of a team should not be allowed to create team accesses."""
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "member")])
    other_user = factories.UserFactory()

    api_client = APIClient()
    for role in [role[0] for role in models.RoleChoices.choices]:
        response = api_client.post(
            f"/api/v1.0/teams/{team.id!s}/accesses/",
            {
                "user": str(other_user.id),
                "role": role,
            },
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        assert response.status_code == 403
        assert response.json() == {
            "detail": "You are not allowed to manage accesses for this team."
        }

    assert not models.TeamAccess.objects.filter(user=other_user).exists()


def test_api_team_accesses_create_authenticated_administrator():
    """
    Administrators of a team should be able to create team accesses except for the "owner" role.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "administrator")])
    other_user = factories.UserFactory()

    api_client = APIClient()

    # It should not be allowed to create an owner access
    response = api_client.post(
        f"/api/v1.0/teams/{team.id!s}/accesses/",
        {
            "user": str(other_user.id),
            "role": "owner",
        },
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "Only owners of a team can assign other users as owners."
    }

    # It should be allowed to create a lower access
    role = random.choice(
        [role[0] for role in models.RoleChoices.choices if role[0] != "owner"]
    )

    response = api_client.post(
        f"/api/v1.0/teams/{team.id!s}/accesses/",
        {
            "user": str(other_user.id),
            "role": role,
        },
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 201
    assert models.TeamAccess.objects.filter(user=other_user).count() == 1
    new_team_access = models.TeamAccess.objects.filter(user=other_user).get()
    assert response.json() == {
        "abilities": new_team_access.get_abilities(user),
        "id": str(new_team_access.id),
        "role": role,
        "user": str(other_user.id),
    }


def test_api_team_accesses_create_authenticated_owner():
    """
    Owners of a team should be able to create team accesses whatever the role.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "owner")])
    other_user = factories.UserFactory()

    role = random.choice([role[0] for role in models.RoleChoices.choices])

    response = APIClient().post(
        f"/api/v1.0/teams/{team.id!s}/accesses/",
        {
            "user": str(other_user.id),
            "role": role,
        },
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 201
    assert models.TeamAccess.objects.filter(user=other_user).count() == 1
    new_team_access = models.TeamAccess.objects.filter(user=other_user).get()
    assert response.json() == {
        "abilities": new_team_access.get_abilities(user),
        "id": str(new_team_access.id),
        "role": role,
        "user": str(other_user.id),
    }


def test_api_team_accesses_update_anonymous():
    """Anonymous users should not be allowed to update a team access."""
    access = factories.TeamAccessFactory()
    old_values = serializers.TeamAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user": factories.UserFactory().id,
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    api_client = APIClient()
    for field, value in new_values.items():
        response = api_client.put(
            f"/api/v1.0/teams/{access.team.id!s}/accesses/{access.id!s}/",
            {**old_values, field: value},
            format="json",
        )
        assert response.status_code == 401

    access.refresh_from_db()
    updated_values = serializers.TeamAccessSerializer(instance=access).data
    assert updated_values == old_values


def test_api_team_accesses_update_authenticated_unrelated():
    """
    Authenticated users should not be allowed to update a team access for a team to which
    they are not related.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    access = factories.TeamAccessFactory()
    old_values = serializers.TeamAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user": factories.UserFactory().id,
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    api_client = APIClient()
    for field, value in new_values.items():
        response = api_client.put(
            f"/api/v1.0/teams/{access.team.id!s}/accesses/{access.id!s}/",
            {**old_values, field: value},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        assert response.status_code == 403

    access.refresh_from_db()
    updated_values = serializers.TeamAccessSerializer(instance=access).data
    assert updated_values == old_values


def test_api_team_accesses_update_authenticated_member():
    """Members of a team should not be allowed to update its accesses."""
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "member")])
    access = factories.TeamAccessFactory(team=team)
    old_values = serializers.TeamAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user": factories.UserFactory().id,
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    api_client = APIClient()
    for field, value in new_values.items():
        response = api_client.put(
            f"/api/v1.0/teams/{access.team.id!s}/accesses/{access.id!s}/",
            {**old_values, field: value},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        assert response.status_code == 403

    access.refresh_from_db()
    updated_values = serializers.TeamAccessSerializer(instance=access).data
    assert updated_values == old_values


def test_api_team_accesses_update_administrator_except_owner():
    """
    A user who is an administrator in a team should be allowed to update a user
    access for this team, as long as they don't try to set the role to owner.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "administrator")])
    access = factories.TeamAccessFactory(
        team=team,
        role=random.choice(["administrator", "member"]),
    )
    old_values = serializers.TeamAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user_id": factories.UserFactory().id,
        "role": random.choice(["administrator", "member"]),
    }

    api_client = APIClient()
    for field, value in new_values.items():
        new_data = {**old_values, field: value}
        response = api_client.put(
            f"/api/v1.0/teams/{team.id!s}/accesses/{access.id!s}/",
            data=new_data,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        if (
            new_data["role"] == old_values["role"]
        ):  # we are not really updating the role
            assert response.status_code == 403
        else:
            assert response.status_code == 200

        access.refresh_from_db()
        updated_values = serializers.TeamAccessSerializer(instance=access).data
        if field == "role":
            assert updated_values == {**old_values, "role": new_values["role"]}
        else:
            assert updated_values == old_values


def test_api_team_accesses_update_administrator_from_owner():
    """
    A user who is an administrator in a team, should not be allowed to update
    the user access of an "owner" for this team.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "administrator")])
    other_user = factories.UserFactory()
    access = factories.TeamAccessFactory(team=team, user=other_user, role="owner")
    old_values = serializers.TeamAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user_id": factories.UserFactory().id,
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    api_client = APIClient()
    for field, value in new_values.items():
        response = api_client.put(
            f"/api/v1.0/teams/{team.id!s}/accesses/{access.id!s}/",
            data={**old_values, field: value},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        assert response.status_code == 403
        access.refresh_from_db()
        updated_values = serializers.TeamAccessSerializer(instance=access).data
        assert updated_values == old_values


def test_api_team_accesses_update_administrator_to_owner():
    """
    A user who is an administrator in a team, should not be allowed to update
    the user access of another user to grant team ownership.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "administrator")])
    other_user = factories.UserFactory()
    access = factories.TeamAccessFactory(
        team=team,
        user=other_user,
        role=random.choice(["administrator", "member"]),
    )
    old_values = serializers.TeamAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user_id": factories.UserFactory().id,
        "role": "owner",
    }

    api_client = APIClient()
    for field, value in new_values.items():
        new_data = {**old_values, field: value}
        response = api_client.put(
            f"/api/v1.0/teams/{team.id!s}/accesses/{access.id!s}/",
            data=new_data,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        # We are not allowed or not really updating the role
        if field == "role" or new_data["role"] == old_values["role"]:
            assert response.status_code == 403
        else:
            assert response.status_code == 200

        access.refresh_from_db()
        updated_values = serializers.TeamAccessSerializer(instance=access).data
        assert updated_values == old_values


def test_api_team_accesses_update_owner_except_owner():
    """
    A user who is an owner in a team should be allowed to update
    a user access for this team except for existing "owner" accesses.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "owner")])
    factories.UserFactory()
    access = factories.TeamAccessFactory(
        team=team,
        role=random.choice(["administrator", "member"]),
    )
    old_values = serializers.TeamAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user_id": factories.UserFactory().id,
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    api_client = APIClient()
    for field, value in new_values.items():
        new_data = {**old_values, field: value}
        response = api_client.put(
            f"/api/v1.0/teams/{team.id!s}/accesses/{access.id!s}/",
            data=new_data,
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        if (
            new_data["role"] == old_values["role"]
        ):  # we are not really updating the role
            assert response.status_code == 403
        else:
            assert response.status_code == 200

        access.refresh_from_db()
        updated_values = serializers.TeamAccessSerializer(instance=access).data

        if field == "role":
            assert updated_values == {**old_values, "role": new_values["role"]}
        else:
            assert updated_values == old_values


def test_api_team_accesses_update_owner_for_owners():
    """
    A user who is "owner" of a team should not be allowed to update
    an existing owner access for this team.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "owner")])
    access = factories.TeamAccessFactory(team=team, role="owner")
    old_values = serializers.TeamAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user_id": factories.UserFactory().id,
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    api_client = APIClient()
    for field, value in new_values.items():
        response = api_client.put(
            f"/api/v1.0/teams/{team.id!s}/accesses/{access.id!s}/",
            data={**old_values, field: value},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        assert response.status_code == 403
        access.refresh_from_db()
        updated_values = serializers.TeamAccessSerializer(instance=access).data
        assert updated_values == old_values


def test_api_team_accesses_update_owner_self():
    """
    A user who is owner of a team should be allowed to update
    their own user access provided there are other owners in the team.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory()
    access = factories.TeamAccessFactory(team=team, user=user, role="owner")
    old_values = serializers.TeamAccessSerializer(instance=access).data
    new_role = random.choice(["administrator", "member"])

    api_client = APIClient()
    response = api_client.put(
        f"/api/v1.0/teams/{team.id!s}/accesses/{access.id!s}/",
        data={**old_values, "role": new_role},
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 403
    access.refresh_from_db()
    assert access.role == "owner"

    # Add another owner and it should now work
    factories.TeamAccessFactory(team=team, role="owner")

    response = api_client.put(
        f"/api/v1.0/teams/{team.id!s}/accesses/{access.id!s}/",
        data={**old_values, "role": new_role},
        format="json",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 200
    access.refresh_from_db()
    assert access.role == new_role


# Delete


def test_api_team_accesses_delete_anonymous():
    """Anonymous users should not be allowed to destroy a team access."""
    access = factories.TeamAccessFactory()

    response = APIClient().delete(
        f"/api/v1.0/teams/{access.team.id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 401
    assert models.TeamAccess.objects.count() == 1


def test_api_team_accesses_delete_authenticated():
    """
    Authenticated users should not be allowed to delete a team access for a
    team to which they are not related.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    access = factories.TeamAccessFactory()

    response = APIClient().delete(
        f"/api/v1.0/teams/{access.team.id!s}/accesses/{access.id!s}/",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 403
    assert models.TeamAccess.objects.count() == 1


def test_api_team_accesses_delete_member():
    """
    Authenticated users should not be allowed to delete a team access for a
    team in which they are a simple member.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "member")])
    access = factories.TeamAccessFactory(team=team)

    assert models.TeamAccess.objects.count() == 2
    assert models.TeamAccess.objects.filter(user=access.user).exists()

    response = APIClient().delete(
        f"/api/v1.0/teams/{team.id!s}/accesses/{access.id!s}/",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 403
    assert models.TeamAccess.objects.count() == 2


def test_api_team_accesses_delete_administrators():
    """
    Users who are administrators in a team should be allowed to delete an access
    from the team provided it is not ownership.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "administrator")])
    access = factories.TeamAccessFactory(
        team=team, role=random.choice(["member", "administrator"])
    )

    assert models.TeamAccess.objects.count() == 2
    assert models.TeamAccess.objects.filter(user=access.user).exists()

    response = APIClient().delete(
        f"/api/v1.0/teams/{team.id!s}/accesses/{access.id!s}/",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 204
    assert models.TeamAccess.objects.count() == 1


def test_api_team_accesses_delete_owners_except_owners():
    """
    Users should be able to delete the team access of another user
    for a team of which they are owner provided it is not an owner access.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "owner")])
    access = factories.TeamAccessFactory(
        team=team, role=random.choice(["member", "administrator"])
    )

    assert models.TeamAccess.objects.count() == 2
    assert models.TeamAccess.objects.filter(user=access.user).exists()

    response = APIClient().delete(
        f"/api/v1.0/teams/{team.id!s}/accesses/{access.id!s}/",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 204
    assert models.TeamAccess.objects.count() == 1


def test_api_team_accesses_delete_owners_for_owners():
    """
    Users should not be allowed to delete the team access of another owner
    even for a team in which they are direct owner.
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory(users=[(user, "owner")])
    access = factories.TeamAccessFactory(team=team, role="owner")

    assert models.TeamAccess.objects.count() == 2
    assert models.TeamAccess.objects.filter(user=access.user).exists()

    response = APIClient().delete(
        f"/api/v1.0/teams/{team.id!s}/accesses/{access.id!s}/",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 403
    assert models.TeamAccess.objects.count() == 2


def test_api_team_accesses_delete_owners_last_owner():
    """
    It should not be possible to delete the last owner access from a team
    """
    identity = factories.IdentityFactory()
    user = identity.user
    jwt_token = OIDCToken.for_user(user)

    team = factories.TeamFactory()
    access = factories.TeamAccessFactory(team=team, user=user, role="owner")

    assert models.TeamAccess.objects.count() == 1
    response = APIClient().delete(
        f"/api/v1.0/teams/{team.id!s}/accesses/{access.id!s}/",
        HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
    )

    assert response.status_code == 403
    assert models.TeamAccess.objects.count() == 1
