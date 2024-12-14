import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from '@hocuspocus/provider';
import WebSocket from 'ws';

const port = 5559;
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

import { hocusPocusServer } from '@/servers/hocusPocusServer';

import { promiseDone } from '../src/helpers';
import { initServer } from '../src/servers/appServer';

const { server } = initServer();

describe('Server Tests', () => {
  beforeAll(async () => {
    await hocusPocusServer.configure({ port: portWS }).listen();
  });

  afterAll(() => {
    server.close();
    void hocusPocusServer.destroy();
  });

  test('WebSocket connection with correct API key can connect', () => {
    const { promise, done } = promiseDone();

    // eslint-disable-next-line jest/unbound-method
    const { handleConnection } = hocusPocusServer;
    const mockHandleConnection = jest.fn();
    (hocusPocusServer.handleConnection as jest.Mock) = mockHandleConnection;

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
      hocusPocusServer.handleConnection = handleConnection;
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
        void hocusPocusServer
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
