import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from '@hocuspocus/provider';
import request from 'supertest';
import WebSocket from 'ws';

const port = 5555;
const portWS = 6666;
const origin = 'http://localhost:3000';

jest.mock('../src/env', () => {
  return {
    PORT: port,
    COLLABORATION_SERVER_ORIGIN: origin,
    COLLABORATION_SERVER_SECRET: 'test-secret-api-key',
    Y_PROVIDER_API_KEY: 'yprovider-api-key',
  };
});

console.error = jest.fn();

import { promiseDone } from '../src/helpers';
import { hocuspocusServer, initServer } from '../src/server'; // Adjust the path to your server file

const { app, server } = initServer();

describe('Server Tests', () => {
  beforeAll(async () => {
    await hocuspocusServer.configure({ port: portWS }).listen();
  });

  afterAll(() => {
    server.close();
    void hocuspocusServer.destroy();
  });

  test('Ping Pong', async () => {
    const response = await request(app as any).get('/ping');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('pong');
  });

  test('POST /collaboration/api/reset-connections?room=[ROOM_ID] invalid origin', async () => {
    const response = await request(app as any)
      .post('/collaboration/api/reset-connections/?room=test-room')
      .set('Origin', 'http://invalid-origin.com')
      .send({ document_id: 'test-document' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('CORS policy violation: Invalid Origin');
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
    const { closeConnections } = hocuspocusServer;
    const mockHandleConnection = jest.fn();
    (hocuspocusServer.closeConnections as jest.Mock) = mockHandleConnection;

    const response = await request(app as any)
      .post('/collaboration/api/reset-connections?room=test-room')
      .set('Origin', origin)
      .set('Authorization', 'test-secret-api-key');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Connections reset');

    expect(mockHandleConnection).toHaveBeenCalled();
    mockHandleConnection.mockClear();
    hocuspocusServer.closeConnections = closeConnections;
  });

  test('POST /api/convert-markdown with incorrect API key should return 403', async () => {
    const response = await request(app as any)
      .post('/api/convert-markdown')
      .set('Origin', origin)
      .set('Authorization', 'wrong-api-key');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden: Invalid API Key');
  });

  test('POST /api/convert-markdown with a Bearer token', async () => {
    const response = await request(app as any)
      .post('/api/convert-markdown')
      .set('Origin', origin)
      .set('Authorization', 'Bearer test-secret-api-key');

    // Warning: Changing the authorization header to Bearer token format will break backend compatibility with this microservice.
    expect(response.status).toBe(403);
  });

  test('POST /api/convert-markdown with missing body param content', async () => {
    const response = await request(app as any)
      .post('/api/convert-markdown')
      .set('Origin', origin)
      .set('Authorization', 'yprovider-api-key');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid request: missing content');
  });

  test('POST /api/convert-markdown with body param content being an empty string', async () => {
    const response = await request(app as any)
      .post('/api/convert-markdown')
      .set('Origin', origin)
      .set('Authorization', 'yprovider-api-key')
      .send({
        content: '',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid request: missing content');
  });

  ['/collaboration/api/anything/', '/', '/anything'].forEach((path) => {
    test(`"${path}" endpoint should be forbidden`, async () => {
      const response = await request(app as any).post(path);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });
  });

  test('WebSocket connection with correct API key can connect', () => {
    const { promise, done } = promiseDone();

    // eslint-disable-next-line jest/unbound-method
    const { handleConnection } = hocuspocusServer;
    const mockHandleConnection = jest.fn();
    (hocuspocusServer.handleConnection as jest.Mock) = mockHandleConnection;

    const clientWS = new WebSocket(
      `ws://localhost:${port}/collaboration/ws/?room=test-room`,
      {
        headers: {
          authorization: 'test-secret-api-key',
          Origin: origin,
        },
      },
    );

    clientWS.on('open', () => {
      expect(mockHandleConnection).toHaveBeenCalled();
      clientWS.close();
      mockHandleConnection.mockClear();
      hocuspocusServer.handleConnection = handleConnection;
      done();
    });

    return promise;
  });

  test('WebSocket connection with bad origin should be closed', () => {
    const { promise, done } = promiseDone();

    const ws = new WebSocket(
      `ws://localhost:${port}/collaboration/ws/?room=test-room`,
      {
        headers: {
          Origin: 'http://bad-origin.com',
        },
      },
    );

    ws.onclose = () => {
      expect(ws.readyState).toBe(ws.CLOSED);
      done();
    };

    return promise;
  });

  test('WebSocket connection with incorrect API key should be closed', () => {
    const { promise, done } = promiseDone();
    const ws = new WebSocket(
      `ws://localhost:${port}/collaboration/ws/?room=test-room`,
      {
        headers: {
          Authorization: 'wrong-api-key',
          Origin: origin,
        },
      },
    );

    ws.onclose = () => {
      expect(ws.readyState).toBe(ws.CLOSED);
      done();
    };

    return promise;
  });

  test('WebSocket connection not allowed if room not matching provider name', () => {
    const { promise, done } = promiseDone();

    const wsHocus = new HocuspocusProviderWebsocket({
      url: `ws://localhost:${portWS}/?room=my-test`,
      WebSocketPolyfill: WebSocket,
      maxAttempts: 1,
      quiet: true,
    });

    const provider = new HocuspocusProvider({
      websocketProvider: wsHocus,
      name: 'hocuspocus-test',
      broadcast: false,
      quiet: true,
      preserveConnection: false,
      onClose: (data) => {
        wsHocus.stopConnectionAttempt();
        expect(data.event.reason).toBe('Forbidden');
        wsHocus.webSocket?.close();
        wsHocus.disconnect();
        provider.destroy();
        wsHocus.destroy();
        done();
      },
    });

    return promise;
  });

  test('WebSocket connection read-only', () => {
    const { promise, done } = promiseDone();

    const wsHocus = new HocuspocusProviderWebsocket({
      url: `ws://localhost:${portWS}/?room=hocuspocus-test`,
      WebSocketPolyfill: WebSocket,
    });

    const provider = new HocuspocusProvider({
      websocketProvider: wsHocus,
      name: 'hocuspocus-test',
      broadcast: false,
      quiet: true,
      onConnect: () => {
        void hocuspocusServer
          .openDirectConnection('hocuspocus-test')
          .then((connection) => {
            connection.document?.getConnections().forEach((connection) => {
              expect(connection.readOnly).toBe(true);
            });

            void connection.disconnect();
          });

        provider.destroy();
        wsHocus.destroy();
        done();
      },
    });

    return promise;
  });
});
