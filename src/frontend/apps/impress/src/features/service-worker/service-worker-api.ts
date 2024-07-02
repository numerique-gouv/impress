import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, NetworkOnly } from 'workbox-strategies';

import { ApiPlugin } from './ApiPlugin';
import { DocsDB } from './DocsDB';
import { SyncManager } from './SyncManager';
import { DAYS_EXP, SW_DEV_API, getCacheNameVersion } from './conf';

declare const self: ServiceWorkerGlobalScope;

const syncManager = new SyncManager(DocsDB.sync, DocsDB.hasSyncToDo);

self.addEventListener('activate', function (event) {
  event.waitUntil(DocsDB.cleanupOutdatedVersion());
});

export const isApiUrl = (href: string) => {
  return (
    href.includes(`${self.location.origin}/api/`) ||
    href.includes(`${SW_DEV_API}/api/`)
  );
};

/**
 * API routes
 */
registerRoute(
  ({ url }) =>
    isApiUrl(url.href) && url.href.match(/.*\/documents\/\?(page|ordering)=.*/),
  new NetworkOnly({
    plugins: [
      new ApiPlugin({
        tableName: 'doc-list',
        type: 'list',
        syncManager,
      }),
    ],
  }),
  'GET',
);

registerRoute(
  ({ url }) => isApiUrl(url.href) && url.href.match(/.*\/documents\/.*\//),
  new NetworkOnly({
    plugins: [
      new ApiPlugin({
        tableName: 'doc-item',
        type: 'item',
        syncManager,
      }),
    ],
  }),
  'GET',
);

registerRoute(
  ({ url }) => isApiUrl(url.href) && url.href.match(/.*\/documents\/.*\//),
  new NetworkOnly({
    plugins: [
      new ApiPlugin({
        type: 'update',
        syncManager,
      }),
    ],
  }),
  'PATCH',
);

registerRoute(
  ({ url }) => isApiUrl(url.href) && url.href.match(/.*\/documents\//),
  new NetworkOnly({
    plugins: [
      new ApiPlugin({
        type: 'create',
        syncManager,
      }),
    ],
  }),
  'POST',
);

registerRoute(
  ({ url }) => isApiUrl(url.href) && url.href.match(/.*\/documents\/.*\//),
  new NetworkOnly({
    plugins: [
      new ApiPlugin({
        type: 'delete',
        syncManager,
      }),
    ],
  }),
  'DELETE',
);

registerRoute(
  ({ url }) => isApiUrl(url.href),
  new NetworkFirst({
    cacheName: getCacheNameVersion('api'),
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxAgeSeconds: 24 * 60 * 60 * DAYS_EXP,
      }),
    ],
  }),
  'GET',
);
