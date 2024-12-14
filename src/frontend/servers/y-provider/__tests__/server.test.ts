import request from 'supertest';

const port = 5557;
const origin = 'http://localhost:3000';

jest.mock('../src/env', () => {
  return {
    PORT: port,
    COLLABORATION_SERVER_ORIGIN: origin,
  };
});

console.error = jest.fn();

import { initServer } from '../src/servers/appServer';

const { app, server } = initServer();

describe('Server Tests', () => {
  afterAll(() => {
    server.close();
  });

  test('Ping Pong', async () => {
    const response = await request(app as any).get('/ping');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('pong');
  });

  ['/collaboration/api/anything/', '/', '/anything'].forEach((path) => {
    test(`"${path}" endpoint should be forbidden`, async () => {
      const response = await request(app as any).post(path);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });
  });
});
