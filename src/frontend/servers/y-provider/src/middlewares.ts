import { NextFunction, Request, Response } from 'express';
import * as ws from 'ws';

import {
  COLLABORATION_SERVER_ORIGIN,
  COLLABORATION_SERVER_SECRET,
} from '@/env';

import { logger } from './utils';

export const httpSecurity = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Origin check
  const origin = req.headers['origin'];
  if (origin && COLLABORATION_SERVER_ORIGIN !== origin) {
    logger('CORS policy violation: Invalid Origin', origin);

    res
      .status(403)
      .json({ error: 'CORS policy violation: Invalid Origin', origin });
    return;
  }

  // Secret API Key check
  // Note: Changing this header to Bearer token format will break backend compatibility with this microservice.
  const apiKey = req.headers['authorization'];
  if (apiKey !== COLLABORATION_SERVER_SECRET) {
    res.status(403).json({ error: 'Forbidden: Invalid API Key' });
    return;
  }

  next();
};

export const wsSecurity = (
  ws: ws.WebSocket,
  req: Request,
  next: NextFunction,
): void => {
  // Origin check
  const origin = req.headers['origin'];
  if (COLLABORATION_SERVER_ORIGIN !== origin) {
    console.error('CORS policy violation: Invalid Origin', origin);
    ws.close();
    return;
  }

  // Secret API Key check
  const apiKey = req.headers['authorization'];
  if (apiKey !== COLLABORATION_SERVER_SECRET) {
    console.error('Forbidden: Invalid API Key');
    ws.close();
    return;
  }

  next();
};
