import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

import { ApiPlugin } from './ApiPlugin';
import { SyncManager } from './SyncManager';

declare const self: ServiceWorkerGlobalScope;

const syncManager = new SyncManager(ApiPlugin.sync, ApiPlugin.hasSyncToDo);

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
        tableName: 'doc-mutation',
        type: 'update',
        syncManager,
      }),
    ],
  }),
  'PATCH',
);
