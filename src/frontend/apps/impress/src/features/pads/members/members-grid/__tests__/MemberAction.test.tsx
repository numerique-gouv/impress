import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';

import { Access, Pad, Role } from '@/features/pads/pad-management';
import { AppWrapper } from '@/tests/utils';

import { MemberAction } from '../components/MemberAction';

const access: Access = {
  id: '789',
  role: Role.ADMIN,
  user: {
    id: '11',
    email: 'user1@test.com',
  },
  team: '',
  abilities: {
    set_role_to: [Role.READER, Role.ADMIN],
  } as any,
};

const doc = {
  id: '123456',
  title: 'teamName',
} as Pad;

describe('MemberAction', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  it('checks the render when owner', async () => {
    render(
      <MemberAction access={access} currentRole={Role.OWNER} doc={doc} />,
      {
        wrapper: AppWrapper,
      },
    );

    expect(
      await screen.findByLabelText('Open the member options modal'),
    ).toBeInTheDocument();
  });

  it('checks the render when reader', () => {
    render(
      <MemberAction access={access} currentRole={Role.READER} doc={doc} />,
      {
        wrapper: AppWrapper,
      },
    );

    expect(
      screen.queryByLabelText('Open the member options modal'),
    ).not.toBeInTheDocument();
  });

  it('checks the render when editor', () => {
    render(
      <MemberAction access={access} currentRole={Role.EDITOR} doc={doc} />,
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
      <MemberAction access={access} currentRole={Role.ADMIN} doc={doc} />,
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
        doc={doc}
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
