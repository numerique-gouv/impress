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
  };
});

console.error = jest.fn();

import { hocuspocusServer, initServer } from '../src/server'; // Adjust the path to your server file

const { app, server } = initServer();

describe('Server Tests', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      if (server.listening) {
        resolve();
      }
    });

    await new Promise<void>((resolve) => {
      void hocuspocusServer
        .configure({
          port: portWS,
        })
        .listen()
        .then(() => {
          resolve();
        });
    });
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
    const response = await request(app as any)
      .post('/collaboration/api/reset-connections?room=test-room')
      .set('Origin', origin)
      .set('Authorization', 'test-secret-api-key');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Connections reset');
  });

  test('POST /api/convert-markdown with incorrect API key should return 403', async () => {
    const response = await request(app as any)
      .post('/api/convert-markdown')
      .set('Origin', origin)
      .set('Authorization', 'wrong-api-key');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden: Invalid API Key');
  });

  test('POST /api/convert-markdown with missing body param content', async () => {
    const response = await request(app as any)
      .post('/api/convert-markdown')
      .set('Origin', origin)
      .set('Authorization', 'test-secret-api-key');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid request: missing content');
  });

  test('POST /api/convert-markdown with valid body param content', async () => {
    const response = await request(app as any)
      .post('/api/convert-markdown')
      .set('Origin', origin)
      .set('Authorization', 'test-secret-api-key')
      .send({
        content: '# Title in markdown',
      });

    expect(response.status).toBe(200);
    expect(response.body.content).toBe('wip-update-this-base64-string');
  });

  test('POST /api/convert-markdown with body param content being an empty string', async () => {
    const response = await request(app as any)
      .post('/api/convert-markdown')
      .set('Origin', origin)
      .set('Authorization', 'test-secret-api-key')
      .send({
        content: '',
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('No valid blocks were generated');
  });

  ['/collaboration/api/anything/', '/', '/anything'].forEach((path) => {
    test(`"${path}" endpoint should be forbidden`, async () => {
      const response = await request(app as any).post(path);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });
  });

  test('WebSocket connection with correct API key can connect', () => {
    return new Promise<void>((resolve) => {
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
        resolve();
      });
    });
  });

  test('WebSocket connection with bad origin should be closed', () => {
    return new Promise<void>((resolve) => {
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
        resolve();
      };
    });
  });

  test('WebSocket connection with incorrect API key should be closed', () => {
    return new Promise<void>((resolve) => {
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
        resolve();
      };
    });
  });

  test('WebSocket connection not allowed if room not matching provider name', () => {
    const wsHocus = new HocuspocusProviderWebsocket({
      url: `ws://localhost:${portWS}/?room=my-test`,
      WebSocketPolyfill: WebSocket,
      maxAttempts: 1,
      quiet: true,
    });

    return new Promise<void>((resolve) => {
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
          resolve();
        },
      });
    });
  });

  test('WebSocket connection read-only', () => {
    const wsHocus = new HocuspocusProviderWebsocket({
      url: `ws://localhost:${portWS}/?room=hocuspocus-test`,
      WebSocketPolyfill: WebSocket,
    });

    return new Promise<void>((resolve) => {
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
          resolve();
        },
      });
    });
  });
});
