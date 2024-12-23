import request from 'supertest';

const port = 5555;
const origin = 'http://localhost:3000';

jest.mock('../src/env', () => {
  return {
    PORT: port,
    COLLABORATION_SERVER_ORIGIN: origin,
    COLLABORATION_SERVER_SECRET: 'test-secret-api-key',
  };
});

console.error = jest.fn();

import { hocusPocusServer } from '@/servers/hocusPocusServer';

import { initServer } from '../src/servers/appServer';

const { app, server } = initServer();

describe('Server Tests', () => {
  afterAll(() => {
    server.close();
  });

  test('POST /collaboration/api/reset-connections?room=[ROOM_ID] with incorrect API key should return 403', async () => {
    const response = await request(app as any)
      .post('/collaboration/api/reset-connections/?room=test-room')
      .set('Origin', origin)
      .set('Authorization', 'wrong-api-key');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden: Invalid API Key');
  });

  test('POST /collaboration/api/reset-connections?room=[ROOM_ID] failed if room not indicated', async () => {
    const response = await request(app as any)
      .post('/collaboration/api/reset-connections/')
      .set('Origin', origin)
      .set('Authorization', 'test-secret-api-key')
      .send({ document_id: 'test-document' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Room name not provided');
  });

  test('POST /collaboration/api/reset-connections?room=[ROOM_ID] with correct API key should reset connections', async () => {
    // eslint-disable-next-line jest/unbound-method
    const { closeConnections } = hocusPocusServer;
    const mockHandleConnection = jest.fn();
    (hocusPocusServer.closeConnections as jest.Mock) = mockHandleConnection;

    const response = await request(app as any)
      .post('/collaboration/api/reset-connections?room=test-room')
      .set('Origin', origin)
      .set('Authorization', 'test-secret-api-key');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Connections reset');

    expect(mockHandleConnection).toHaveBeenCalled();
    mockHandleConnection.mockClear();
    hocusPocusServer.closeConnections = closeConnections;
  });
});
