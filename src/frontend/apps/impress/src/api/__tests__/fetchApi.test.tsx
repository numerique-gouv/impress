import fetchMock from 'fetch-mock';

import { fetchAPI } from '@/api';
import { useAuthStore } from '@/core/auth';

describe('fetchAPI', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  it('adds correctly the basename', () => {
    fetchMock.mock('http://test.jest/api/some/url', 200);

    void fetchAPI('some/url');

    expect(fetchMock.lastUrl()).toEqual('http://test.jest/api/some/url');
  });

  it('adds the credentials automatically', () => {
    fetchMock.mock('http://test.jest/api/some/url', 200);

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
    const mockReplace = jest.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      enumerable: true,
      value: {
        replace: mockReplace,
      },
    });

    useAuthStore.setState({ userData: { email: 'test@test.com', id: '1234' } });

    fetchMock.mock('http://test.jest/api/some/url', 401);

    await fetchAPI('some/url');

    expect(useAuthStore.getState().userData).toBeUndefined();

    expect(mockReplace).toHaveBeenCalledWith(
      'http://test.jest/api/authenticate/',
    );
  });
});
