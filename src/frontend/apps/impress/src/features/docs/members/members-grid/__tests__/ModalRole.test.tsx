import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';

import { useAuthStore } from '@/core/auth';
import { Access, Role } from '@/features/docs/doc-management';
import { AppWrapper } from '@/tests/utils';

import { ModalRole } from '../components/ModalRole';

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
  team: '123',
  user: {
    id: '11',
    email: 'user1@test.com',
  },
  abilities: {
    set_role_to: [Role.EDITOR, Role.ADMIN],
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
        docId="123"
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
    fetchMock.mock(`end:/documents/123/accesses/789/`, {
      status: 200,
      ok: true,
    });

    const onClose = jest.fn();
    render(
      <ModalRole
        access={access}
        currentRole={Role.OWNER}
        onClose={onClose}
        docId="123"
      />,
      { wrapper: AppWrapper },
    );

    expect(
      screen.getByRole('radio', {
        name: 'Administrator',
      }),
    ).toBeChecked();

    await userEvent.click(
      screen.getByRole('radio', {
        name: 'Reader',
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

    expect(fetchMock.lastUrl()).toContain(`/documents/123/accesses/789/`);

    expect(onClose).toHaveBeenCalled();
  });

  it('fails to update the role', async () => {
    fetchMock.patchOnce(`end:/documents/123/accesses/789/`, {
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
        docId="123"
      />,
      { wrapper: AppWrapper },
    );

    await userEvent.click(
      screen.getByRole('radio', {
        name: 'Reader',
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
        docId="123"
      />,
      { wrapper: AppWrapper },
    );

    expect(
      screen.getByText(
        'You are the sole owner of this group, make another member the group owner, before you can change your own role.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('radio', {
        name: 'Administrator',
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole('radio', {
        name: 'Owner',
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole('radio', {
        name: 'Reader',
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole('radio', {
        name: 'Editor',
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
        docId="123"
      />,
      { wrapper: AppWrapper },
    );

    expect(
      screen.getByText('You cannot update the role of other owner.'),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('radio', {
        name: 'Administrator',
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole('radio', {
        name: 'Owner',
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole('radio', {
        name: 'Reader',
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole('radio', {
        name: 'Editor',
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
        docId="123"
      />,
      { wrapper: AppWrapper },
    );

    expect(
      screen.getByRole('radio', {
        name: 'Editor',
      }),
    ).toBeEnabled();

    expect(
      screen.getByRole('radio', {
        name: 'Reader',
      }),
    ).toBeEnabled();

    expect(
      screen.getByRole('radio', {
        name: 'Administrator',
      }),
    ).toBeEnabled();

    expect(
      screen.getByRole('radio', {
        name: 'Owner',
      }),
    ).toBeDisabled();
  });
});
