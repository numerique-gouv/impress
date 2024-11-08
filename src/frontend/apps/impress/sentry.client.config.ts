import * as Sentry from '@sentry/nextjs';

import packageJson from './package.json';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENV,
  integrations: [Sentry.replayIntegration()],
  release: packageJson.version,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  tracesSampleRate: 1.0,
});
