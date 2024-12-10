// eslint-disable-next-line import/order
import './services/sentry';
import { ServerBlockNoteEditor } from '@blocknote/server-util';
import { Server } from '@hocuspocus/server';
import * as Sentry from '@sentry/node';
import express, { Request, Response } from 'express';
import expressWebsockets from 'express-ws';
import * as Y from 'yjs';

import { PORT } from './env';
import { httpSecurity, wsSecurity } from './middlelayers';
import { routes } from './routes';
import { logger, toBase64 } from './utils';

export const hocuspocusServer = Server.configure({
  name: 'docs-y-server',
  timeout: 30000,
  quiet: true,
  onConnect({ requestHeaders, connection, documentName, requestParameters }) {
    const roomParam = requestParameters.get('room');
    const canEdit = requestHeaders['x-can-edit'] === 'True' ? true : false;

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
  app.ws(routes.WS, wsSecurity, (ws, req) => {
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
   * Route to reset connections in a room
   */
  app.post(
    routes.RESET_CONNECTIONS,
    httpSecurity,
    async (
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

      const docConnection = await hocuspocusServer.openDirectConnection(room);
      docConnection.document?.getConnections().forEach((connection) => {
        if (!userId) {
          connection.close();
          return;
        }

        const connectionUserId = connection.request.headers['x-user-id'];
        if (connectionUserId === userId) {
          connection.close();
        }
      });

      await docConnection.disconnect();

      res.status(200).json({ message: 'Connections reset' });
    },
  );

  interface ConversionRequest {
    content: string;
  }

  interface ConversionResponse {
    content: string;
  }

  interface ErrorResponse {
    error: string;
  }

  /**
   * Route to convert markdown
   */
  app.post(
    routes.CONVERT_MARKDOWN,
    httpSecurity,
    async (
      req: Request<
        object,
        ConversionResponse | ErrorResponse,
        ConversionRequest,
        object
      >,
      res: Response<ConversionResponse | ErrorResponse>,
    ) => {
      const content = req.body?.content;

      if (!content) {
        res.status(400).json({ error: 'Invalid request: missing content' });
        return;
      }

      try {
        const editor = ServerBlockNoteEditor.create();

        // Perform the conversion from markdown to Blocknote.js blocks
        const blocks = await editor.tryParseMarkdownToBlocks(content);

        if (!blocks || blocks.length === 0) {
          res.status(500).json({ error: 'No valid blocks were generated' });
          return;
        }

        // Create a Yjs Document from blocks, and encode it as a base64 string
        const yDocument = editor.blocksToYDoc(blocks, 'document-store');
        const documentContent = toBase64(Y.encodeStateAsUpdate(yDocument));

        res.status(200).json({ content: documentContent });
      } catch (e) {
        logger('conversion failed:', e);
        res.status(500).json({ error: 'An error occurred' });
      }
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
