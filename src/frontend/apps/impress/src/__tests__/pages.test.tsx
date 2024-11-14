import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { AppWrapper } from '@/tests/utils';

import Page from '../pages';

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

describe('Page', () => {
  it('checks Page rendering', () => {
    render(<Page />, { wrapper: AppWrapper });

    expect(
      screen.getByRole('button', {
        name: /Create a new document/i,
      }),
    ).toBeInTheDocument();
  });
});
