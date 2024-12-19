import { IncomingMessage } from 'http';

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
export const collaborationHTTPHandler = async (
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
  const canEdit = req.headers['x-can-edit'] === 'True';

  if (!room) {
    res.status(400).json({ error: 'Room name not provided' });
    return;
  }

  const syncYDoc64 = await syncDoc(room, yDoc64, canEdit, req);

  /**
   * If the document does not exist, create a new one
   */

  res.status(200).json({
    yDoc64: syncYDoc64,
  });
};

const syncDoc = async (
  room: string,
  yDoc64: string,
  canEdit: boolean,
  req: Partial<Pick<IncomingMessage, 'headers' | 'url'>>,
) => {
  let docExist = false;
  let syncYDoc = undefined;
  hocusPocusServer.documents.forEach((hpYDoc) => {
    if (hpYDoc.name !== room) {
      return;
    }

    docExist = true;
    syncYDoc = hpYDoc;
    const hpYDoc64 = toBase64(Y.encodeStateAsUpdate(hpYDoc));

    if (canEdit && yDoc64 !== hpYDoc64) {
      const ydoc = base64ToYDoc(yDoc64);
      syncYDoc = hpYDoc.merge(ydoc);
      logger('Polling Updated YDoc:', room);
    }
  });

  if (!docExist) {
    const hpYDoc = await hocusPocusServer.createDocument(room, req, '123456', {
      readOnly: false,
      requiresAuthentication: false,
      isAuthenticated: true,
    });

    const ydoc = base64ToYDoc(yDoc64);
    syncYDoc = hpYDoc.merge(ydoc);
  }

  return syncYDoc && toBase64(Y.encodeStateAsUpdate(syncYDoc));
};
