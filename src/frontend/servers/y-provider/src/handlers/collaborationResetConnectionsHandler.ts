import { Request, Response } from 'express';

import { hocusPocusServer } from '@/servers/hocusPocusServer';
import { logger } from '@/utils';

type ResetConnectionsRequestQuery = {
  room?: string;
};

export const collaborationResetConnectionsHandler = (
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
    hocusPocusServer.closeConnections(room);
  } else {
    /**
     * Close connections for the user in the room
     */
    hocusPocusServer.documents.forEach((doc) => {
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
};
