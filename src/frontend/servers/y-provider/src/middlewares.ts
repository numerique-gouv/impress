import cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import * as ws from 'ws';

import {
  COLLABORATION_SERVER_ORIGIN,
  COLLABORATION_SERVER_SECRET,
  Y_PROVIDER_API_KEY,
} from '@/env';

const VALID_API_KEYS = [COLLABORATION_SERVER_SECRET, Y_PROVIDER_API_KEY];
const allowedOrigins = COLLABORATION_SERVER_ORIGIN.split(',');

export const corsMiddleware = cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true,
});

export const httpSecurity = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Secret API Key check
  // Note: Changing this header to Bearer token format will break backend compatibility with this microservice.
  const apiKey = req.headers['authorization'];
  if (!apiKey || !VALID_API_KEYS.includes(apiKey)) {
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
  if (origin && !allowedOrigins.includes(origin)) {
    ws.close(4001, 'Origin not allowed');
    console.error('CORS policy violation: Invalid Origin', origin);
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
