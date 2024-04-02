import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';

import { Role } from '@/features/teams';
import { AppWrapper } from '@/tests/utils';

import { MemberAction } from '../components/MemberAction';
import { Access } from '../types';

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

describe('MemberAction', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  it('checks the render when owner', async () => {
    render(
      <MemberAction access={access} currentRole={Role.OWNER} teamId="123" />,
      {
        wrapper: AppWrapper,
      },
    );

    expect(
      await screen.findByLabelText('Open the member options modal'),
    ).toBeInTheDocument();
  });

  it('checks the render when member', () => {
    render(
      <MemberAction access={access} currentRole={Role.MEMBER} teamId="123" />,
      {
        wrapper: AppWrapper,
      },
    );

    expect(
      screen.queryByLabelText('Open the member options modal'),
    ).not.toBeInTheDocument();
  });

  it('checks the render when admin', async () => {
    render(
      <MemberAction access={access} currentRole={Role.ADMIN} teamId="123" />,
      {
        wrapper: AppWrapper,
      },
    );

    expect(
      await screen.findByLabelText('Open the member options modal'),
    ).toBeInTheDocument();
  });

  it('checks the render when admin to owner', () => {
    render(
      <MemberAction
        access={{ ...access, role: Role.OWNER }}
        currentRole={Role.ADMIN}
        teamId="123"
      />,
      {
        wrapper: AppWrapper,
      },
    );

    expect(
      screen.queryByLabelText('Open the member options modal'),
    ).not.toBeInTheDocument();
  });
});
