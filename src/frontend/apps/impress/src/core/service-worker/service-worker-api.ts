import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

import { ApiPlugin } from './ApiPlugin';

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
    plugins: [new ApiPlugin({ tableName: 'doc-list', type: 'list' })],
  }),
  'GET',
);

registerRoute(
  ({ url }) => isApiUrl(url.href) && url.href.match(/.*\/documents\/.*\//),
  new NetworkOnly({
    plugins: [new ApiPlugin({ tableName: 'doc-item', type: 'item' })],
  }),
  'GET',
);
