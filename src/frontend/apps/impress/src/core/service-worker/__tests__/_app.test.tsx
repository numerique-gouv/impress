import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { Router } from 'next/router';
import { PropsWithChildren, ReactElement } from 'react';

import App from '@/pages/_app';
import { AppWrapper } from '@/tests/utils';
import { NextPageWithLayout } from '@/types/next';

const Page: NextPageWithLayout = () => {
  return <div>Test Page</div>;
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <div>{page}</div>;
};

jest.mock('@/core/', () => ({
  ...jest.requireActual('@/core/'),
  AppProvider: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

describe('App', () => {
  it('checks service-worker is register', () => {
    process.env.NEXT_PUBLIC_BUILD_ID = '123456';
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const registerSpy = jest.fn();
    registerSpy.mockImplementation(
      () =>
        new Promise((reject) => {
          reject('error');
        }),
    );
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: registerSpy,
      },
      writable: true,
    });

    render(<App Component={Page} router={{} as Router} pageProps={{}} />, {
      wrapper: AppWrapper,
    });

    expect(registerSpy).toHaveBeenCalledWith('/service-worker.js?v=123456');
  });

  it('checks service-worker is not register', () => {
    process.env.NEXT_PUBLIC_SW_DEACTIVATED = 'true';
    process.env.NEXT_PUBLIC_BUILD_ID = '123456';

    const registerSpy = jest.fn();
    registerSpy.mockImplementation(
      () =>
        new Promise((reject) => {
          reject('error');
        }),
    );
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: registerSpy,
      },
      writable: true,
    });

    render(<App Component={Page} router={{} as Router} pageProps={{}} />, {
      wrapper: AppWrapper,
    });

    expect(registerSpy).not.toHaveBeenCalledWith('/service-worker.js?v=123456');
  });
});
