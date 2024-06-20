import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

import { ApiPlugin } from './ApiPlugin';
import { DocsDB } from './DocsDB';
import { SyncManager } from './SyncManager';

declare const self: ServiceWorkerGlobalScope;

const syncManager = new SyncManager(DocsDB.sync, DocsDB.hasSyncToDo);

self.addEventListener('activate', function (event) {
  event.waitUntil(DocsDB.cleanupOutdatedVersion());
});

export const isApiUrl = (href: string) => {
  const devDomain = 'http://localhost:8071';
  return (
    href.includes(`${self.location.origin}/api/`) ||
    href.includes(`${devDomain}/api/`)
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
