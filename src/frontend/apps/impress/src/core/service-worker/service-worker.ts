/// <reference lib="webworker" />

import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { setCacheNameDetails } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { googleFontsCache, warmStrategyCache } from 'workbox-recipes';
import {
  registerRoute,
  setCatchHandler,
  setDefaultHandler,
} from 'workbox-routing';
import {
  CacheFirst,
  NetworkFirst,
  NetworkFirstOptions,
  StrategyOptions,
} from 'workbox-strategies';

// eslint-disable-next-line import/order
import { ApiPlugin } from './ApiPlugin';
import { isApiUrl } from './service-worker-api';

// eslint-disable-next-line import/order
import pkg from '@/../package.json';

declare const self: ServiceWorkerGlobalScope & {
  __WB_DISABLE_DEV_LOGS: boolean;
};

self.__WB_DISABLE_DEV_LOGS = true;

setCacheNameDetails({
  prefix: pkg.name,
  suffix: `v${pkg.version}`,
});

const getCacheNameVersion = (cacheName: string) =>
  `${pkg.name}-${cacheName}-v${pkg.version}`;

/**
 * In development, use NetworkFirst strategy, in production use CacheFirst strategy
 * We will be able to test the application in development without having to clear the cache.
 * @param url
 * @param options
 * @returns strategy
 */
const getStrategy = (
  options?: NetworkFirstOptions | StrategyOptions,
): NetworkFirst | CacheFirst => {
  const devDomains = [
    'http://localhost:3000',
    'https://impress.127.0.0.1.nip.io',
    'https://impress-staging.beta.numerique.gouv.fr',
  ];

  return devDomains.some((devDomain) =>
    self.location.origin.includes(devDomain),
  )
    ? new NetworkFirst(options)
    : new CacheFirst(options);
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
  const cacheAllow = `v${pkg.version}`;

  event.waitUntil(
    // Delete old caches
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (!key.includes(cacheAllow)) {
              return caches.delete(key);
            }
          }),
        );
      })
      .then(void self.clients.claim()),
  );
});

/**
 * Precache resources
 */
const FALLBACK = {
  offline: '/offline/',
  docs: '/docs/[id]/',
  images: '/assets/img-not-found.svg',
};
const precacheResources = [
  '/',
  '/index.html',
  '/404/',
  '/accessibility/',
  '/legal-notice/',
  '/personal-data-cookies/',
  FALLBACK.offline,
  FALLBACK.images,
  FALLBACK.docs,
];

const precacheStrategy = getStrategy({
  cacheName: getCacheNameVersion('precache'),
  plugins: [new CacheableResponsePlugin({ statuses: [0, 200, 404] })],
});

warmStrategyCache({ urls: precacheResources, strategy: precacheStrategy });

/**
 * Handle requests that fail
 */
setCatchHandler(async ({ request, url, event }) => {
  switch (true) {
    case isApiUrl(url.href):
      return ApiPlugin.getApiCatchHandler();

    case request.destination === 'document':
      if (url.pathname.match(/^\/docs\/.*\//)) {
        return precacheStrategy.handle({ event, request: FALLBACK.docs });
      }

      return precacheStrategy.handle({ event, request: FALLBACK.offline });

    case request.destination === 'image':
      return precacheStrategy.handle({ event, request: FALLBACK.images });

    default:
      return Response.error();
  }
});

const DAYS_EXP = 5;

/**
 * Cache stategy static files images (images / svg)
 */
registerRoute(
  ({ request }) => request.destination === 'image',
  getStrategy({
    cacheName: getCacheNameVersion('images'),
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxAgeSeconds: 24 * 60 * 60 * DAYS_EXP,
      }),
    ],
  }),
);

/**
 * Cache stategy static files fonts
 */
googleFontsCache();
registerRoute(
  ({ request }) => request.destination === 'font',
  getStrategy({
    cacheName: getCacheNameVersion('fonts'),
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxAgeSeconds: 24 * 60 * 60 * 30, // 30 days
      }),
    ],
  }),
);

/**
 * Cache stategy static files (css, js, workers)
 */
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker',
  getStrategy({
    cacheName: getCacheNameVersion('static'),
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxAgeSeconds: 24 * 60 * 60 * DAYS_EXP,
      }),
    ],
  }),
);

/**
 * Cache all other files
 */
setDefaultHandler(
  getStrategy({
    cacheName: getCacheNameVersion('default'),
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxAgeSeconds: 24 * 60 * 60 * DAYS_EXP,
      }),
    ],
  }),
);
