/**
 * @jest-environment node
 */

import '@testing-library/jest-dom';

import { RequestSerializer } from '../RequestSerializer';

describe('RequestSerializer', () => {
  it('checks RequestSerializer.fromRequest', async () => {
    const request = new Request('http://test.jest', {
      method: 'GET',
      referrer: 'http://test.jest/referer',
      referrerPolicy: 'no-referrer',
      mode: 'cors',
      credentials: 'omit',
      cache: 'default',
      redirect: 'follow',
      integrity: 'integrity',
      keepalive: true,
    });

    const requestSerializer = await RequestSerializer.fromRequest(request);

    expect(requestSerializer.toObject()).toStrictEqual({
      cache: 'default',
      credentials: 'omit',
      headers: {},
      integrity: 'integrity',
      keepalive: true,
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      referrer: 'http://test.jest/referer',
      referrerPolicy: 'no-referrer',
      url: 'http://test.jest/',
    });

    expect(requestSerializer.toRequest()).toBeInstanceOf(Request);
    expect(requestSerializer.clone()).toBeInstanceOf(RequestSerializer);
  });

  it('checks RequestSerializer.arrayBufferToString', async () => {
    const request = new Request('http://test.jest', {
      body: JSON.stringify({ test: 'test' }),
      method: 'POST',
    });

    const body = await request.clone().arrayBuffer();
    const bodyString = RequestSerializer.arrayBufferToString(body);

    expect(bodyString).toBe(JSON.stringify({ test: 'test' }));
  });

  it('checks RequestSerializer.arrayBufferToJson', async () => {
    const request = new Request('http://test.jest', {
      body: JSON.stringify({ test: 'test' }),
      method: 'POST',
    });

    const body = await request.clone().arrayBuffer();
    const bodyJson = RequestSerializer.arrayBufferToJson(body);

    expect(bodyJson).toStrictEqual({ test: 'test' });
  });

  it('checks RequestSerializer.stringToArrayBuffer', () => {
    const bodyString = RequestSerializer.stringToArrayBuffer(
      JSON.stringify({ test: 'test' }),
    );

    expect(bodyString).toBeInstanceOf(ArrayBuffer);
  });
});
