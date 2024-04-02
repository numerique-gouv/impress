import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';

import { useAuthStore } from '@/core/auth';
import { Role } from '@/features/teams';
import { AppWrapper } from '@/tests/utils';

import { ModalRole } from '../components/ModalRole';
import { Access } from '../types';

const toast = jest.fn();
jest.mock('@openfun/cunningham-react', () => ({
  ...jest.requireActual('@openfun/cunningham-react'),
  useToastProvider: () => ({
    toast,
  }),
}));

HTMLDialogElement.prototype.showModal = jest.fn(function mock(
  this: HTMLDialogElement,
) {
  this.open = true;
});

const access: Access = {
  id: '789',
  role: Role.ADMIN,
  user: {
    id: '11',
    name: 'username1',
    email: 'user1@test.com',
  },
  abilities: {
    set_role_to: [Role.MEMBER, Role.ADMIN],
  } as any,
};

describe('ModalRole', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  it('checks the cancel button', async () => {
    const onClose = jest.fn();
    render(
      <ModalRole
        access={access}
        currentRole={Role.ADMIN}
        onClose={onClose}
        teamId="123"
      />,
      {
        wrapper: AppWrapper,
      },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Cancel',
      }),
    );

    expect(onClose).toHaveBeenCalled();
  });

  it('updates the role successfully', async () => {
    fetchMock.patchOnce(`/api/teams/123/accesses/789/`, {
      status: 200,
      ok: true,
    });

    const onClose = jest.fn();
    render(
      <ModalRole
        access={access}
        currentRole={Role.OWNER}
        onClose={onClose}
        teamId="123"
      />,
      { wrapper: AppWrapper },
    );

    expect(
      screen.getByRole('radio', {
        name: 'Admin',
      }),
    ).toBeChecked();

    await userEvent.click(
      screen.getByRole('radio', {
        name: 'Member',
      }),
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Validate',
      }),
    );

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        'The role has been updated',
        'success',
        {
          duration: 4000,
        },
      );
    });

    expect(fetchMock.lastUrl()).toBe(`/api/teams/123/accesses/789/`);

    expect(onClose).toHaveBeenCalled();
  });

  it('fails to update the role', async () => {
    fetchMock.patchOnce(`/api/teams/123/accesses/789/`, {
      status: 500,
      body: {
        detail: 'The server is totally broken',
      },
    });

    render(
      <ModalRole
        access={access}
        currentRole={Role.OWNER}
        onClose={jest.fn()}
        teamId="123"
      />,
      { wrapper: AppWrapper },
    );

    await userEvent.click(
      screen.getByRole('radio', {
        name: 'Member',
      }),
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Validate',
      }),
    );

    expect(
      await screen.findByText('The server is totally broken'),
    ).toBeInTheDocument();
  });

  it('checks the render when last owner', () => {
    useAuthStore.setState({
      userData: access.user,
    });

    const access2: Access = {
      ...access,
      role: Role.OWNER,
      abilities: {
        set_role_to: [],
      } as any,
    };

    render(
      <ModalRole
        access={access2}
        currentRole={Role.OWNER}
        onClose={jest.fn()}
        teamId="123"
      />,
      { wrapper: AppWrapper },
    );

    expect(
      screen.getByText('You are the last owner, you cannot change your role.'),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('radio', {
        name: 'Admin',
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole('radio', {
        name: 'Owner',
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole('radio', {
        name: 'Member',
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole('button', {
        name: 'Validate',
      }),
    ).toBeDisabled();
  });

  it('checks the render when it is another owner', () => {
    useAuthStore.setState({
      userData: {
        id: '12',
        name: 'username2',
        email: 'username2@test.com',
      },
    });

    const access2: Access = {
      ...access,
      role: Role.OWNER,
    };

    render(
      <ModalRole
        access={access2}
        currentRole={Role.OWNER}
        onClose={jest.fn()}
        teamId="123"
      />,
      { wrapper: AppWrapper },
    );

    expect(
      screen.getByText('You cannot update the role of other owner.'),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('radio', {
        name: 'Admin',
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole('radio', {
        name: 'Owner',
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole('radio', {
        name: 'Member',
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole('button', {
        name: 'Validate',
      }),
    ).toBeDisabled();
  });

  it('checks the render when current user is admin', () => {
    render(
      <ModalRole
        access={access}
        currentRole={Role.ADMIN}
        onClose={jest.fn()}
        teamId="123"
      />,
      { wrapper: AppWrapper },
    );

    expect(
      screen.getByRole('radio', {
        name: 'Member',
      }),
    ).toBeEnabled();

    expect(
      screen.getByRole('radio', {
        name: 'Admin',
      }),
    ).toBeEnabled();

    expect(
      screen.getByRole('radio', {
        name: 'Owner',
      }),
    ).toBeDisabled();
  });
});
