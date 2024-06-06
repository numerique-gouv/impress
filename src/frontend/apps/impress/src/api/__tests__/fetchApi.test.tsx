import fetchMock from 'fetch-mock';

import { fetchAPI } from '@/api';
import { useAuthStore } from '@/core/auth';

describe('fetchAPI', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  it('adds correctly the basename', () => {
    fetchMock.mock('http://test.jest/api/v1.0/some/url', 200);

    void fetchAPI('some/url');

    expect(fetchMock.lastUrl()).toEqual('http://test.jest/api/v1.0/some/url');
  });

  it('adds the credentials automatically', () => {
    fetchMock.mock('http://test.jest/api/v1.0/some/url', 200);

    void fetchAPI('some/url', { body: 'some body' });

    expect(fetchMock.lastOptions()).toEqual({
      body: 'some body',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('logout if 401 response', async () => {
    const logoutMock = jest.fn();
    jest
      .spyOn(useAuthStore.getState(), 'logout')
      .mockImplementation(logoutMock);

    fetchMock.mock('http://test.jest/api/v1.0/some/url', 401);

    await fetchAPI('some/url');

    expect(logoutMock).toHaveBeenCalled();
  });

  it('check the versionning', () => {
    fetchMock.mock('http://test.jest/api/v2.0/some/url', 200);

    void fetchAPI('some/url', {}, '2.0');

    expect(fetchMock.lastUrl()).toEqual('http://test.jest/api/v2.0/some/url');
  });
});
