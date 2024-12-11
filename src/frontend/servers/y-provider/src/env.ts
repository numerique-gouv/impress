export const COLLABORATION_LOGGING =
  process.env.COLLABORATION_LOGGING || 'false';
export const COLLABORATION_SERVER_ORIGIN =
  process.env.COLLABORATION_SERVER_ORIGIN || 'http://localhost:3000';
export const COLLABORATION_SERVER_SECRET =
  process.env.COLLABORATION_SERVER_SECRET || 'secret-api-key';
export const PORT = Number(process.env.PORT || 4444);
export const SENTRY_DSN = process.env.SENTRY_DSN || '';
