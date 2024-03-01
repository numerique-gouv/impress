"""
Test template accesses API endpoints for users in publish's core app.
"""
import random
from uuid import uuid4

import pytest
from rest_framework.test import APIClient

from core import factories, models
from core.api import serializers

pytestmark = pytest.mark.django_db


def test_api_template_accesses_list_anonymous():
    """Anonymous users should not be allowed to list template accesses."""
    template = factories.TemplateFactory()
    factories.TemplateAccessFactory.create_batch(2, template=template)

    response = APIClient().get(f"/api/v1.0/templates/{template.id!s}/accesses/")
    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }


def test_api_template_accesses_list_authenticated_unrelated():
    """
    Authenticated users should not be allowed to list template accesses for a template
    to which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory()
    factories.TemplateAccessFactory.create_batch(3, template=template)

    # Accesses for other templates to which the user is related should not be listed either
    other_access = factories.TemplateAccessFactory(user=user)
    factories.TemplateAccessFactory(template=other_access.template)

    response = client.get(
        f"/api/v1.0/templates/{template.id!s}/accesses/",
    )
    assert response.status_code == 200
    assert response.json() == {
        "count": 0,
        "next": None,
        "previous": None,
        "results": [],
    }


def test_api_template_accesses_list_authenticated_related():
    """
    Authenticated users should be able to list template accesses for a template
    to which they are related, whatever their role in the template.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory()
    user_access = models.TemplateAccess.objects.create(
        template=template, user=user
    )  # random role
    access1, access2 = factories.TemplateAccessFactory.create_batch(
        2, template=template
    )

    # Accesses for other templates to which the user is related should not be listed either
    other_access = factories.TemplateAccessFactory(user=user)
    factories.TemplateAccessFactory(template=other_access.template)

    response = client.get(
        f"/api/v1.0/templates/{template.id!s}/accesses/",
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


def test_api_template_accesses_retrieve_anonymous():
    """
    Anonymous users should not be allowed to retrieve a template access.
    """
    access = factories.TemplateAccessFactory()

    response = APIClient().get(
        f"/api/v1.0/templates/{access.template.id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }


def test_api_template_accesses_retrieve_authenticated_unrelated():
    """
    Authenticated users should not be allowed to retrieve a template access for
    a template to which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory()
    access = factories.TemplateAccessFactory(template=template)

    response = client.get(
        f"/api/v1.0/templates/{template.id!s}/accesses/{access.id!s}/",
    )
    assert response.status_code == 403
    assert response.json() == {
        "detail": "You do not have permission to perform this action."
    }

    # Accesses related to another template should be excluded even if the user is related to it
    for access in [
        factories.TemplateAccessFactory(),
        factories.TemplateAccessFactory(user=user),
    ]:
        response = client.get(
            f"/api/v1.0/templates/{template.id!s}/accesses/{access.id!s}/",
        )

        assert response.status_code == 404
        assert response.json() == {"detail": "Not found."}


def test_api_template_accesses_retrieve_authenticated_related():
    """
    A user who is related to a template should be allowed to retrieve the
    associated template user accesses.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(users=[user])
    access = factories.TemplateAccessFactory(template=template)

    response = client.get(
        f"/api/v1.0/templates/{template.id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": str(access.id),
        "user": str(access.user.id),
        "role": access.role,
        "abilities": access.get_abilities(user),
    }


def test_api_template_accesses_create_anonymous():
    """Anonymous users should not be allowed to create template accesses."""
    user = factories.UserFactory()
    template = factories.TemplateFactory()

    response = APIClient().post(
        f"/api/v1.0/templates/{template.id!s}/accesses/",
        {
            "user": str(user.id),
            "template": str(template.id),
            "role": random.choice(models.RoleChoices.choices)[0],
        },
        format="json",
    )

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication credentials were not provided."
    }
    assert models.TemplateAccess.objects.exists() is False


def test_api_template_accesses_create_authenticated_unrelated():
    """
    Authenticated users should not be allowed to create template accesses for a template to
    which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    other_user = factories.UserFactory()
    template = factories.TemplateFactory()

    response = client.post(
        f"/api/v1.0/templates/{template.id!s}/accesses/",
        {
            "user": str(other_user.id),
        },
        format="json",
    )

    assert response.status_code == 403
    assert not models.TemplateAccess.objects.filter(user=other_user).exists()


def test_api_template_accesses_create_authenticated_member():
    """Members of a template should not be allowed to create template accesses."""
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(users=[(user, "member")])
    other_user = factories.UserFactory()

    for role in [role[0] for role in models.RoleChoices.choices]:
        response = client.post(
            f"/api/v1.0/templates/{template.id!s}/accesses/",
            {
                "user": str(other_user.id),
                "role": role,
            },
            format="json",
        )

        assert response.status_code == 403

    assert not models.TemplateAccess.objects.filter(user=other_user).exists()


def test_api_template_accesses_create_authenticated_administrator():
    """
    Administrators of a template should be able to create template accesses
    except for the "owner" role.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(users=[(user, "administrator")])
    other_user = factories.UserFactory()

    api_client = APIClient()

    # It should not be allowed to create an owner access
    response = client.post(
        f"/api/v1.0/templates/{template.id!s}/accesses/",
        {
            "user": str(other_user.id),
            "role": "owner",
        },
        format="json",
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "Only owners of a template can assign other users as owners."
    }

    # It should be allowed to create a lower access
    role = random.choice(
        [role[0] for role in models.RoleChoices.choices if role[0] != "owner"]
    )

    response = client.post(
        f"/api/v1.0/templates/{template.id!s}/accesses/",
        {
            "user": str(other_user.id),
            "role": role,
        },
        format="json",
    )

    assert response.status_code == 201
    assert models.TemplateAccess.objects.filter(user=other_user).count() == 1
    new_template_access = models.TemplateAccess.objects.filter(user=other_user).get()
    assert response.json() == {
        "abilities": new_template_access.get_abilities(user),
        "id": str(new_template_access.id),
        "role": role,
        "user": str(other_user.id),
    }


def test_api_template_accesses_create_authenticated_owner():
    """
    Owners of a template should be able to create template accesses whatever the role.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(users=[(user, "owner")])
    other_user = factories.UserFactory()

    role = random.choice([role[0] for role in models.RoleChoices.choices])

    response = client.post(
        f"/api/v1.0/templates/{template.id!s}/accesses/",
        {
            "user": str(other_user.id),
            "role": role,
        },
        format="json",
    )

    assert response.status_code == 201
    assert models.TemplateAccess.objects.filter(user=other_user).count() == 1
    new_template_access = models.TemplateAccess.objects.filter(user=other_user).get()
    assert response.json() == {
        "abilities": new_template_access.get_abilities(user),
        "id": str(new_template_access.id),
        "role": role,
        "user": str(other_user.id),
    }


def test_api_template_accesses_update_anonymous():
    """Anonymous users should not be allowed to update a template access."""
    access = factories.TemplateAccessFactory()
    old_values = serializers.TemplateAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user": factories.UserFactory().id,
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    api_client = APIClient()
    for field, value in new_values.items():
        response = api_client.put(
            f"/api/v1.0/templates/{access.template.id!s}/accesses/{access.id!s}/",
            {**old_values, field: value},
            format="json",
        )
        assert response.status_code == 401

    access.refresh_from_db()
    updated_values = serializers.TemplateAccessSerializer(instance=access).data
    assert updated_values == old_values


def test_api_template_accesses_update_authenticated_unrelated():
    """
    Authenticated users should not be allowed to update a template access for a template to which
    they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    access = factories.TemplateAccessFactory()
    old_values = serializers.TemplateAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user": factories.UserFactory().id,
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    for field, value in new_values.items():
        response = client.put(
            f"/api/v1.0/templates/{access.template.id!s}/accesses/{access.id!s}/",
            {**old_values, field: value},
            format="json",
        )
        assert response.status_code == 403

    access.refresh_from_db()
    updated_values = serializers.TemplateAccessSerializer(instance=access).data
    assert updated_values == old_values


def test_api_template_accesses_update_authenticated_member():
    """Members of a template should not be allowed to update its accesses."""
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(users=[(user, "member")])
    access = factories.TemplateAccessFactory(template=template)
    old_values = serializers.TemplateAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user": factories.UserFactory().id,
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    for field, value in new_values.items():
        response = client.put(
            f"/api/v1.0/templates/{access.template.id!s}/accesses/{access.id!s}/",
            {**old_values, field: value},
            format="json",
        )
        assert response.status_code == 403

    access.refresh_from_db()
    updated_values = serializers.TemplateAccessSerializer(instance=access).data
    assert updated_values == old_values


def test_api_template_accesses_update_administrator_except_owner():
    """
    A user who is an administrator in a template should be allowed to update a user
    access for this template, as long as they don't try to set the role to owner.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(users=[(user, "administrator")])
    access = factories.TemplateAccessFactory(
        template=template,
        role=random.choice(["administrator", "member"]),
    )
    old_values = serializers.TemplateAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user_id": factories.UserFactory().id,
        "role": random.choice(["administrator", "member"]),
    }

    for field, value in new_values.items():
        new_data = {**old_values, field: value}
        response = client.put(
            f"/api/v1.0/templates/{template.id!s}/accesses/{access.id!s}/",
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
        updated_values = serializers.TemplateAccessSerializer(instance=access).data
        if field == "role":
            assert updated_values == {**old_values, "role": new_values["role"]}
        else:
            assert updated_values == old_values


def test_api_template_accesses_update_administrator_from_owner():
    """
    A user who is an administrator in a template, should not be allowed to update
    the user access of an "owner" for this template.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(users=[(user, "administrator")])
    other_user = factories.UserFactory()
    access = factories.TemplateAccessFactory(
        template=template, user=other_user, role="owner"
    )
    old_values = serializers.TemplateAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user_id": factories.UserFactory().id,
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    for field, value in new_values.items():
        response = client.put(
            f"/api/v1.0/templates/{template.id!s}/accesses/{access.id!s}/",
            data={**old_values, field: value},
            format="json",
        )

        assert response.status_code == 403
        access.refresh_from_db()
        updated_values = serializers.TemplateAccessSerializer(instance=access).data
        assert updated_values == old_values


def test_api_template_accesses_update_administrator_to_owner():
    """
    A user who is an administrator in a template, should not be allowed to update
    the user access of another user to grant template ownership.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(users=[(user, "administrator")])
    other_user = factories.UserFactory()
    access = factories.TemplateAccessFactory(
        template=template,
        user=other_user,
        role=random.choice(["administrator", "member"]),
    )
    old_values = serializers.TemplateAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user_id": factories.UserFactory().id,
        "role": "owner",
    }

    for field, value in new_values.items():
        new_data = {**old_values, field: value}
        response = client.put(
            f"/api/v1.0/templates/{template.id!s}/accesses/{access.id!s}/",
            data=new_data,
            format="json",
        )
        # We are not allowed or not really updating the role
        if field == "role" or new_data["role"] == old_values["role"]:
            assert response.status_code == 403
        else:
            assert response.status_code == 200

        access.refresh_from_db()
        updated_values = serializers.TemplateAccessSerializer(instance=access).data
        assert updated_values == old_values


def test_api_template_accesses_update_owner():
    """
    A user who is an owner in a template should be allowed to update
    a user access for this template whatever the role.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(users=[(user, "owner")])
    factories.UserFactory()
    access = factories.TemplateAccessFactory(
        template=template,
    )
    old_values = serializers.TemplateAccessSerializer(instance=access).data

    new_values = {
        "id": uuid4(),
        "user_id": factories.UserFactory().id,
        "role": random.choice(models.RoleChoices.choices)[0],
    }

    for field, value in new_values.items():
        new_data = {**old_values, field: value}
        response = client.put(
            f"/api/v1.0/templates/{template.id!s}/accesses/{access.id!s}/",
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
        updated_values = serializers.TemplateAccessSerializer(instance=access).data

        if field == "role":
            assert updated_values == {**old_values, "role": new_values["role"]}
        else:
            assert updated_values == old_values


def test_api_template_accesses_update_owner_self():
    """
    A user who is owner of a template should be allowed to update
    their own user access provided there are other owners in the template.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory()
    access = factories.TemplateAccessFactory(template=template, user=user, role="owner")
    old_values = serializers.TemplateAccessSerializer(instance=access).data
    new_role = random.choice(["administrator", "member"])

    response = client.put(
        f"/api/v1.0/templates/{template.id!s}/accesses/{access.id!s}/",
        data={**old_values, "role": new_role},
        format="json",
    )

    assert response.status_code == 403
    access.refresh_from_db()
    assert access.role == "owner"

    # Add another owner and it should now work
    factories.TemplateAccessFactory(template=template, role="owner")

    response = client.put(
        f"/api/v1.0/templates/{template.id!s}/accesses/{access.id!s}/",
        data={**old_values, "role": new_role},
        format="json",
    )

    assert response.status_code == 200
    access.refresh_from_db()
    assert access.role == new_role


# Delete


def test_api_template_accesses_delete_anonymous():
    """Anonymous users should not be allowed to destroy a template access."""
    access = factories.TemplateAccessFactory()

    response = APIClient().delete(
        f"/api/v1.0/templates/{access.template.id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 401
    assert models.TemplateAccess.objects.count() == 1


def test_api_template_accesses_delete_authenticated():
    """
    Authenticated users should not be allowed to delete a template access for a
    template to which they are not related.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    access = factories.TemplateAccessFactory()

    response = client.delete(
        f"/api/v1.0/templates/{access.template.id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 403
    assert models.TemplateAccess.objects.count() == 1


def test_api_template_accesses_delete_member():
    """
    Authenticated users should not be allowed to delete a template access for a
    template in which they are a simple member.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(users=[(user, "member")])
    access = factories.TemplateAccessFactory(template=template)

    assert models.TemplateAccess.objects.count() == 2
    assert models.TemplateAccess.objects.filter(user=access.user).exists()

    response = client.delete(
        f"/api/v1.0/templates/{template.id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 403
    assert models.TemplateAccess.objects.count() == 2


def test_api_template_accesses_delete_administrators_except_owners():
    """
    Users who are administrators in a template should be allowed to delete an access
    from the template provided it is not ownership.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(users=[(user, "administrator")])
    access = factories.TemplateAccessFactory(
        template=template, role=random.choice(["member", "administrator"])
    )

    assert models.TemplateAccess.objects.count() == 2
    assert models.TemplateAccess.objects.filter(user=access.user).exists()

    response = client.delete(
        f"/api/v1.0/templates/{template.id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 204
    assert models.TemplateAccess.objects.count() == 1


def test_api_template_accesses_delete_administrators_owners():
    """
    Users who are administrators in a template should not be allowed to delete an ownership
    access from the template.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(users=[(user, "administrator")])
    access = factories.TemplateAccessFactory(template=template, role="owner")

    assert models.TemplateAccess.objects.count() == 2
    assert models.TemplateAccess.objects.filter(user=access.user).exists()

    response = client.delete(
        f"/api/v1.0/templates/{template.id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 403
    assert models.TemplateAccess.objects.count() == 2


def test_api_template_accesses_delete_owners():
    """
    Users should be able to delete the template access of another user
    for a template of which they are owner.
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory(users=[(user, "owner")])
    access = factories.TemplateAccessFactory(
        template=template,
    )

    assert models.TemplateAccess.objects.count() == 2
    assert models.TemplateAccess.objects.filter(user=access.user).exists()

    response = client.delete(
        f"/api/v1.0/templates/{template.id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 204
    assert models.TemplateAccess.objects.count() == 1


def test_api_template_accesses_delete_owners_last_owner():
    """
    It should not be possible to delete the last owner access from a template
    """
    user = factories.UserFactory()

    client = APIClient()
    client.force_login(user)

    template = factories.TemplateFactory()
    access = factories.TemplateAccessFactory(template=template, user=user, role="owner")

    assert models.TemplateAccess.objects.count() == 1
    response = client.delete(
        f"/api/v1.0/templates/{template.id!s}/accesses/{access.id!s}/",
    )

    assert response.status_code == 403
    assert models.TemplateAccess.objects.count() == 1
