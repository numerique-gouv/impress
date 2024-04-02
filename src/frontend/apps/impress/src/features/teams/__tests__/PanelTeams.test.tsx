import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';

import { Panel } from '@/features/teams';
import { AppWrapper } from '@/tests/utils';

import { TeamList } from '../components/Panel/TeamList';

window.HTMLElement.prototype.scroll = function () {};

jest.mock('next/router', () => ({
  ...jest.requireActual('next/router'),
  useRouter: () => ({
    query: {},
  }),
}));

describe('PanelTeams', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  it('renders with no team to display', async () => {
    fetchMock.mock(`/api/teams/?page=1&ordering=-created_at`, {
      count: 0,
      results: [],
    });

    render(<TeamList />, { wrapper: AppWrapper });

    expect(screen.getByRole('status')).toBeInTheDocument();

    expect(
      await screen.findByText(
        'Create your first team by clicking on the "Create a new team" button.',
      ),
    ).toBeInTheDocument();
  });

  it('renders an empty team', async () => {
    fetchMock.mock(`/api/teams/?page=1&ordering=-created_at`, {
      count: 1,
      results: [
        {
          id: '1',
          name: 'Team 1',
          accesses: [],
        },
      ],
    });

    render(<TeamList />, { wrapper: AppWrapper });

    expect(screen.getByRole('status')).toBeInTheDocument();

    expect(
      await screen.findByLabelText('Empty teams icon'),
    ).toBeInTheDocument();
  });

  it('renders a team with only 1 member', async () => {
    fetchMock.mock(`/api/teams/?page=1&ordering=-created_at`, {
      count: 1,
      results: [
        {
          id: '1',
          name: 'Team 1',
          accesses: [
            {
              id: '1',
              role: 'owner',
            },
          ],
        },
      ],
    });

    render(<TeamList />, { wrapper: AppWrapper });

    expect(screen.getByRole('status')).toBeInTheDocument();

    expect(
      await screen.findByLabelText('Empty teams icon'),
    ).toBeInTheDocument();
  });

  it('renders a non-empty team', async () => {
    fetchMock.mock(`/api/teams/?page=1&ordering=-created_at`, {
      count: 1,
      results: [
        {
          id: '1',
          name: 'Team 1',
          accesses: [
            {
              id: '1',
              role: 'admin',
            },
            {
              id: '2',
              role: 'member',
            },
          ],
        },
      ],
    });

    render(<TeamList />, { wrapper: AppWrapper });

    expect(screen.getByRole('status')).toBeInTheDocument();

    expect(await screen.findByLabelText('Teams icon')).toBeInTheDocument();
  });

  it('renders the error', async () => {
    fetchMock.mock(`/api/teams/?page=1&ordering=-created_at`, {
      status: 500,
    });

    render(<TeamList />, { wrapper: AppWrapper });

    expect(screen.getByRole('status')).toBeInTheDocument();

    expect(
      await screen.findByText(
        'Something bad happens, please refresh the page.',
      ),
    ).toBeInTheDocument();
  });

  it('renders with team panel open', async () => {
    fetchMock.mock(`/api/teams/?page=1&ordering=-created_at`, {
      count: 1,
      results: [],
    });

    render(<Panel />, { wrapper: AppWrapper });

    expect(
      screen.getByRole('button', { name: 'Close the teams panel' }),
    ).toBeVisible();

    expect(await screen.findByText('Recents')).toBeVisible();
  });

  it('closes and opens the team panel', async () => {
    fetchMock.mock(`/api/teams/?page=1&ordering=-created_at`, {
      count: 1,
      results: [],
    });

    render(<Panel />, { wrapper: AppWrapper });

    expect(await screen.findByText('Recents')).toBeVisible();

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Close the teams panel',
      }),
    );

    expect(await screen.findByText('Recents')).not.toBeVisible();

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Open the teams panel',
      }),
    );

    expect(await screen.findByText('Recents')).toBeVisible();
  });
});
