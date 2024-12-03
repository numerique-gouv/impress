// eslint-disable-next-line import/order
import './services/sentry';
import { Server } from '@hocuspocus/server';
import * as Sentry from '@sentry/node';
import express, { Request, Response } from 'express';
import expressWebsockets from 'express-ws';

import { PORT } from './env';
import { httpSecurity, wsSecurity } from './middlewares';
import { routes } from './routes';
import { logger } from './utils';

export const hocuspocusServer = Server.configure({
  name: 'docs-y-server',
  timeout: 30000,
  quiet: true,
  onConnect({ requestHeaders, connection, documentName, requestParameters }) {
    const roomParam = requestParameters.get('room');
    const canEdit = requestHeaders['x-can-edit'] === 'True';

    if (!canEdit) {
      connection.readOnly = true;
    }

    logger(
      'Connection established:',
      documentName,
      'userId:',
      requestHeaders['x-user-id'],
      'canEdit:',
      canEdit,
      'room:',
      requestParameters.get('room'),
    );

    if (documentName !== roomParam) {
      console.error(
        'Invalid room name - Probable hacking attempt:',
        documentName,
        requestParameters.get('room'),
        requestHeaders['x-user-id'],
      );

      return Promise.reject(new Error('Unauthorized'));
    }

    return Promise.resolve();
  },
});

/**
 * init the collaboration server.
 *
 * @param port - The port on which the server listens.
 * @param serverSecret - The secret key for API authentication.
 * @returns An object containing the Express app, Hocuspocus server, and HTTP server instance.
 */
export const initServer = () => {
  const { app } = expressWebsockets(express());
  app.use(express.json());

  /**
   * Route to handle WebSocket connections
   */
  app.ws(routes.COLLABORATION_WS, wsSecurity, (ws, req) => {
    logger('Incoming Origin:', req.headers['origin']);

    try {
      hocuspocusServer.handleConnection(ws, req);
    } catch (error) {
      console.error('Failed to handle WebSocket connection:', error);
      ws.close();
    }
  });

  type ResetConnectionsRequestQuery = {
    room?: string;
  };

  /**
   * Route to reset connections in a room:
   *  - If no user ID is provided, close all connections in the room
   *  - If a user ID is provided, close connections for the user in the room
   */
  app.post(
    routes.COLLABORATION_RESET_CONNECTIONS,
    httpSecurity,
    (
      req: Request<object, object, object, ResetConnectionsRequestQuery>,
      res: Response,
    ) => {
      const room = req.query.room;
      const userId = req.headers['x-user-id'];

      logger(
        'Resetting connections in room:',
        room,
        'for user:',
        userId,
        'room:',
        room,
      );

      if (!room) {
        res.status(400).json({ error: 'Room name not provided' });
        return;
      }

      /**
       * If no user ID is provided, close all connections in the room
       */
      if (!userId) {
        hocuspocusServer.closeConnections(room);
      } else {
        /**
         * Close connections for the user in the room
         */
        hocuspocusServer.documents.forEach((doc) => {
          if (doc.name !== room) {
            return;
          }

          doc.getConnections().forEach((connection) => {
            const connectionUserId = connection.request.headers['x-user-id'];
            if (connectionUserId === userId) {
              connection.close();
            }
          });
        });
      }

      res.status(200).json({ message: 'Connections reset' });
    },
  );

  Sentry.setupExpressErrorHandler(app);

  app.get('/ping', (req, res) => {
    res.status(200).json({ message: 'pong' });
  });

  app.use((req, res) => {
    logger('Invalid route:', req.url);
    res.status(403).json({ error: 'Forbidden' });
  });

  const server = app.listen(PORT, () =>
    console.log('Listening on port :', PORT),
  );

  return { app, server };
};
