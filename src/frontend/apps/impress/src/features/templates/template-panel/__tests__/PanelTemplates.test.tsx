import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';

import { AppWrapper } from '@/tests/utils';

import { Panel } from '../components/Panel';
import { TemplateList } from '../components/TemplateList';

window.HTMLElement.prototype.scroll = function () {};

jest.mock('next/router', () => ({
  ...jest.requireActual('next/router'),
  useRouter: () => ({
    query: {},
  }),
}));

describe('PanelTemplates', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  it('renders with no template to display', async () => {
    fetchMock.mock(`/api/templates/?page=1&ordering=-created_at`, {
      count: 0,
      results: [],
    });

    render(<TemplateList />, { wrapper: AppWrapper });

    expect(screen.getByRole('status')).toBeInTheDocument();

    expect(
      await screen.findByText(
        'Create your first template by clicking on the "Create a new template" button.',
      ),
    ).toBeInTheDocument();
  });

  it('renders an empty template', async () => {
    fetchMock.mock(`/api/templates/?page=1&ordering=-created_at`, {
      count: 1,
      results: [
        {
          id: '1',
          name: 'Template 1',
          accesses: [],
        },
      ],
    });

    render(<TemplateList />, { wrapper: AppWrapper });

    expect(screen.getByRole('status')).toBeInTheDocument();

    expect(
      await screen.findByLabelText('Empty templates icon'),
    ).toBeInTheDocument();
  });

  it('renders a template with only 1 member', async () => {
    fetchMock.mock(`/api/templates/?page=1&ordering=-created_at`, {
      count: 1,
      results: [
        {
          id: '1',
          name: 'Template 1',
          accesses: [
            {
              id: '1',
              role: 'owner',
            },
          ],
        },
      ],
    });

    render(<TemplateList />, { wrapper: AppWrapper });

    expect(screen.getByRole('status')).toBeInTheDocument();

    expect(
      await screen.findByLabelText('Empty templates icon'),
    ).toBeInTheDocument();
  });

  it('renders a non-empty template', async () => {
    fetchMock.mock(`/api/templates/?page=1&ordering=-created_at`, {
      count: 1,
      results: [
        {
          id: '1',
          name: 'Template 1',
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

    render(<TemplateList />, { wrapper: AppWrapper });

    expect(screen.getByRole('status')).toBeInTheDocument();

    expect(await screen.findByLabelText('Templates icon')).toBeInTheDocument();
  });

  it('renders the error', async () => {
    fetchMock.mock(`/api/templates/?page=1&ordering=-created_at`, {
      status: 500,
    });

    render(<TemplateList />, { wrapper: AppWrapper });

    expect(screen.getByRole('status')).toBeInTheDocument();

    expect(
      await screen.findByText(
        'Something bad happens, please refresh the page.',
      ),
    ).toBeInTheDocument();
  });

  it('renders with template panel open', async () => {
    fetchMock.mock(`/api/templates/?page=1&ordering=-created_at`, {
      count: 1,
      results: [],
    });

    render(<Panel />, { wrapper: AppWrapper });

    expect(
      screen.getByRole('button', { name: 'Close the templates panel' }),
    ).toBeVisible();

    expect(await screen.findByText('Recents')).toBeVisible();
  });

  it('closes and opens the template panel', async () => {
    fetchMock.mock(`/api/templates/?page=1&ordering=-created_at`, {
      count: 1,
      results: [],
    });

    render(<Panel />, { wrapper: AppWrapper });

    expect(await screen.findByText('Recents')).toBeVisible();

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Close the templates panel',
      }),
    );

    expect(await screen.findByText('Recents')).not.toBeVisible();

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Open the templates panel',
      }),
    );

    expect(await screen.findByText('Recents')).toBeVisible();
  });
});
