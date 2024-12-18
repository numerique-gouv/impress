import { Request, Response } from 'express';
import * as ws from 'ws';
import * as Y from 'yjs';

import { hocusPocusServer } from '@/servers/hocusPocusServer';
import { base64ToYDoc, logger, toBase64 } from '@/utils';

export const collaborationWSHandler = (ws: ws.WebSocket, req: Request) => {
  logger('Incoming Origin:', req.headers['origin']);

  try {
    hocusPocusServer.handleConnection(ws, req);
  } catch (error) {
    console.error('Failed to handle WebSocket connection:', error);
    ws.close();
  }
};

type ResetConnectionsRequestQuery = {
  room?: string;
};

interface CollaborationHTTPHandlerRequest {
  yDoc64: string;
}

/**
 * Polling way of handling collaboration
 * @param req
 * @param res
 */
export const collaborationHTTPHandler = (
  req: Request<
    object,
    object,
    CollaborationHTTPHandlerRequest,
    ResetConnectionsRequestQuery
  >,
  res: Response,
) => {
  const room = req.query.room;
  const yDoc64 = req.body.yDoc64;

  let newYDoc = undefined;
  hocusPocusServer.documents.forEach((hpYDoc) => {
    if (hpYDoc.name !== room) {
      return;
    }

    newYDoc = hpYDoc;
    const hpYDoc64 = toBase64(Y.encodeStateAsUpdate(hpYDoc));

    if (yDoc64 !== hpYDoc64) {
      const ydoc = base64ToYDoc(yDoc64);
      newYDoc = hpYDoc.merge(ydoc);
      logger('Polling Updated YDoc:', room);
    }
  });

  res.status(200).json({
    yDoc64: newYDoc ? toBase64(Y.encodeStateAsUpdate(newYDoc)) : undefined,
  });
};
