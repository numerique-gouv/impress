import fetchMock from 'fetch-mock';

import { fetchAPI } from '@/api';

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

  it('check the versionning', () => {
    fetchMock.mock('http://test.jest/api/v2.0/some/url', 200);

    void fetchAPI('some/url', {}, '2.0');

    expect(fetchMock.lastUrl()).toEqual('http://test.jest/api/v2.0/some/url');
  });
});
