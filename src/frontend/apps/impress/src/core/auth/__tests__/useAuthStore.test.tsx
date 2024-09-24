import { waitFor } from '@testing-library/react';
import { Crisp } from 'crisp-sdk-web';
import fetchMock from 'fetch-mock';

import { useAuthStore } from '../useAuthStore';

jest.mock('crisp-sdk-web', () => ({
  ...jest.requireActual('crisp-sdk-web'),
  Crisp: {
    setTokenId: jest.fn(),
    user: {
      setEmail: jest.fn(),
    },
    session: {
      reset: jest.fn(),
    },
  },
}));

describe('useAuthStore', () => {
  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('checks initialize support session when initAuth', async () => {
    window.$crisp = true;
    fetchMock.mock('end:users/me/', {
      id: '123456',
      email: 'test@email.com',
    });

    useAuthStore.getState().initAuth();

    await waitFor(() => {
      expect(Crisp.setTokenId).toHaveBeenCalledWith('123456');
    });

    expect(Crisp.user.setEmail).toHaveBeenCalledWith('test@email.com');
  });

  it('checks support session is terminated when logout', () => {
    window.$crisp = true;
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        replace: jest.fn(),
      },
      writable: true,
    });

    useAuthStore.getState().logout();

    expect(Crisp.session.reset).toHaveBeenCalled();
  });
});
