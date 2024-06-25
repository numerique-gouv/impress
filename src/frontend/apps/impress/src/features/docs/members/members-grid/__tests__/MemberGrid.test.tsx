import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';

import { Access, Doc, Role } from '@/features/docs/doc-management';
import { AppWrapper } from '@/tests/utils';

import { MemberGrid } from '../components/MemberGrid';

const doc: Doc = {
  id: '123456',
  title: 'teamName',
  abilities: {
    destroy: true,
    manage_accesses: true,
    partial_update: true,
    retrieve: true,
    update: true,
    versions_destroy: true,
    versions_list: true,
    versions_retrieve: true,
  },
  content: 'content',
  is_public: false,
  accesses: [],
  created_at: '2021-09-01T12:00:00Z',
  updated_at: '2021-09-01T12:00:00Z',
};

describe('MemberGrid', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  it('renders with no member to display', async () => {
    fetchMock.mock(`end:/documents/123456/accesses/?page=1`, {
      count: 0,
      results: [],
    });

    render(<MemberGrid doc={doc} />, {
      wrapper: AppWrapper,
    });

    expect(screen.getByRole('status')).toBeInTheDocument();

    expect(await screen.findByRole('img')).toHaveAttribute(
      'alt',
      'Illustration of an empty table',
    );

    expect(screen.getByText('This table is empty')).toBeInTheDocument();
  });

  it('checks the render with members', async () => {
    const accesses: Access[] = [
      {
        id: '1',
        role: Role.OWNER,
        team: '123456',
        user: {
          id: '11',
          email: 'user1@test.com',
        },
        abilities: {} as any,
      },
      {
        id: '2',
        team: '123456',
        role: Role.EDITOR,
        user: {
          id: '22',
          email: 'user2@test.com',
        },
        abilities: {} as any,
      },
      {
        id: '3',
        team: '123456',
        role: Role.READER,
        user: {
          id: '33',
          email: 'user3@test.com',
        },
        abilities: {} as any,
      },
      {
        id: '4',
        role: Role.ADMIN,
        team: '123456',
        user: {
          id: '44',
          email: 'user4@test.com',
        },
        abilities: {} as any,
      },
    ];

    fetchMock.mock(`end:/documents/123456/accesses/?page=1`, {
      count: 3,
      results: accesses,
    });

    render(<MemberGrid doc={doc} />, {
      wrapper: AppWrapper,
    });

    expect(screen.getByRole('status')).toBeInTheDocument();

    expect(await screen.findByText('user1@test.com')).toBeInTheDocument();
    expect(screen.getByText('user2@test.com')).toBeInTheDocument();
    expect(screen.getByText('user3@test.com')).toBeInTheDocument();
    expect(screen.getByText('user4@test.com')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
    expect(screen.getByText('Reader')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
  });

  it('checks the pagination', async () => {
    const regexp = new RegExp(/.*\/documents\/123456\/accesses\/\?page=.*/);
    fetchMock.get(regexp, {
      count: 40,
      results: Array.from({ length: 20 }, (_, i) => ({
        id: i,
        role: Role.OWNER,
        user: {
          id: i,
          email: `user${i}@test.com`,
        },
        abilities: {} as any,
      })),
    });

    render(<MemberGrid doc={doc} />, {
      wrapper: AppWrapper,
    });

    expect(screen.getByRole('status')).toBeInTheDocument();

    expect(fetchMock.lastUrl()).toContain('/documents/123456/accesses/?page=1');

    expect(
      await screen.findByLabelText('You are currently on page 1'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Go to page 2'));

    expect(
      await screen.findByLabelText('You are currently on page 2'),
    ).toBeInTheDocument();

    expect(fetchMock.lastUrl()).toContain('/documents/123456/accesses/?page=2');
  });

  [
    {
      role: Role.OWNER,
      expected: true,
    },
    {
      role: Role.EDITOR,
      expected: false,
    },
    {
      role: Role.READER,
      expected: false,
    },
    {
      role: Role.ADMIN,
      expected: true,
    },
  ].forEach(({ role, expected }) => {
    it(`checks action button when ${role}`, async () => {
      const regexp = new RegExp(/.*\/documents\/123456\/accesses\/\?page=.*/);
      fetchMock.get(regexp, {
        count: 1,
        results: [
          {
            id: 1,
            role: Role.ADMIN,
            user: {
              id: 1,
              email: `user1@test.com`,
            },
            abilities: {} as any,
          },
        ],
      });

      render(<MemberGrid doc={doc} />, {
        wrapper: AppWrapper,
      });

      expect(screen.getByRole('status')).toBeInTheDocument();

      /* eslint-disable jest/no-conditional-expect */
      if (expected) {
        expect(
          await screen.findAllByRole('button', {
            name: 'Open the member options modal',
          }),
        ).toBeDefined();
      } else {
        expect(
          screen.queryByRole('button', {
            name: 'Open the member options modal',
          }),
        ).not.toBeInTheDocument();
      }
      /* eslint-enable jest/no-conditional-expect */
    });
  });

  it('controls the render when api error', async () => {
    fetchMock.mock(`end:/documents/123456/accesses/?page=1`, {
      status: 500,
      body: {
        cause: 'All broken :(',
      },
    });

    render(<MemberGrid doc={doc} />, {
      wrapper: AppWrapper,
    });

    expect(screen.getByRole('status')).toBeInTheDocument();

    expect(await screen.findByText('All broken :(')).toBeInTheDocument();
  });

  [
    {
      ordering: 'email',
      header_name: 'Emails',
    },
    {
      ordering: 'role',
      header_name: 'Roles',
    },
  ].forEach(({ ordering, header_name }) => {
    it(`checks the sorting per ${ordering}`, async () => {
      const mockedData = [
        {
          id: '123',
          role: Role.ADMIN,
          user: {
            id: '123',
            email: 'albert@test.com',
          },
          abilities: {} as any,
        },
        {
          id: '789',
          role: Role.OWNER,
          user: {
            id: '456',
            email: 'philipp@test.com',
          },
          abilities: {} as any,
        },
        {
          id: '456',
          role: Role.READER,
          user: {
            id: '789',
            email: 'fany@test.com',
          },
          abilities: {} as any,
        },
        {
          id: '963',
          role: Role.EDITOR,
          user: {
            id: '4548',
            email: 'gege@test.com',
          },
          abilities: {} as any,
        },
      ];

      const sortedMockedData = [...mockedData].sort((a, b) => {
        if (ordering === 'email') {
          return a.user.email > b.user.email ? 1 : -1;
        }

        return a.role > b.role ? 1 : -1;
      });
      const reversedMockedData = [...sortedMockedData].reverse();

      fetchMock.get(`end:/documents/123456/accesses/?page=1`, {
        count: 4,
        results: mockedData,
      });

      fetchMock.get(
        `end:/documents/123456/accesses/?page=1&ordering=${ordering}`,
        {
          count: 4,
          results: sortedMockedData,
        },
      );

      fetchMock.get(
        `end:/documents/123456/accesses/?page=1&ordering=-${ordering}`,
        {
          count: 4,
          results: reversedMockedData,
        },
      );

      render(<MemberGrid doc={doc} />, {
        wrapper: AppWrapper,
      });

      expect(screen.getByRole('status')).toBeInTheDocument();

      expect(fetchMock.lastUrl()).toContain(
        `/documents/123456/accesses/?page=1`,
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      let rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('albert');
      expect(rows[2]).toHaveTextContent('philipp');
      expect(rows[3]).toHaveTextContent('fany');
      expect(rows[4]).toHaveTextContent('gege');

      expect(
        screen.queryByLabelText('arrow_drop_down'),
      ).not.toBeInTheDocument();
      expect(screen.queryByLabelText('arrow_drop_up')).not.toBeInTheDocument();

      await userEvent.click(screen.getByText(header_name));

      expect(fetchMock.lastUrl()).toContain(
        `/documents/123456/accesses/?page=1&ordering=${ordering}`,
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      rows = screen.getAllByRole('row');

      expect(rows[1]).toHaveTextContent(sortedMockedData[0].user.email);
      expect(rows[2]).toHaveTextContent(sortedMockedData[1].user.email);
      expect(rows[3]).toHaveTextContent(sortedMockedData[2].user.email);
      expect(rows[4]).toHaveTextContent(sortedMockedData[3].user.email);

      expect(await screen.findByText('arrow_drop_up')).toBeInTheDocument();

      await userEvent.click(screen.getByText(header_name));

      expect(fetchMock.lastUrl()).toContain(
        `/documents/123456/accesses/?page=1&ordering=-${ordering}`,
      );
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent(reversedMockedData[0].user.email);
      expect(rows[2]).toHaveTextContent(reversedMockedData[1].user.email);
      expect(rows[3]).toHaveTextContent(reversedMockedData[2].user.email);
      expect(rows[4]).toHaveTextContent(reversedMockedData[3].user.email);

      expect(await screen.findByText('arrow_drop_down')).toBeInTheDocument();

      await userEvent.click(screen.getByText(header_name));

      expect(fetchMock.lastUrl()).toContain(
        '/documents/123456/accesses/?page=1',
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('albert');
      expect(rows[2]).toHaveTextContent('philipp');
      expect(rows[3]).toHaveTextContent('fany');
      expect(rows[4]).toHaveTextContent('gege');

      expect(
        screen.queryByLabelText('arrow_drop_down'),
      ).not.toBeInTheDocument();
      expect(screen.queryByLabelText('arrow_drop_up')).not.toBeInTheDocument();
    });
  });
});
