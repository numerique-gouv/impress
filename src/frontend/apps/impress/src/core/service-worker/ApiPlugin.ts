import { WorkboxPlugin } from 'workbox-core';

import { Doc, DocsResponse } from '@/features/docs';

import { DBRequest, DocsDB } from './DocsDB';
import { RequestSerializer } from './RequestSerializer';
import { SyncManager } from './SyncManager';

interface OptionsReadonly {
  tableName: 'doc-list' | 'doc-item';
  type: 'list' | 'item';
}

interface OptionsMutate {
  type: 'update' | 'delete' | 'create';
}

type Options = (OptionsReadonly | OptionsMutate) & { syncManager: SyncManager };

export class ApiPlugin implements WorkboxPlugin {
  private readonly options: Options;
  private isFetchDidFailed = false;
  private initialRequest?: Request;

  static getApiCatchHandler = () => {
    return new Response(JSON.stringify({ error: 'Network is unavailable.' }), {
      status: 502,
      statusText: 'Network is unavailable.',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  constructor(options: Options) {
    this.options = options;
  }

  /**
   * This method is called after the response is received.
   * An error server response is not a failed fetch.
   */
  fetchDidSucceed: WorkboxPlugin['fetchDidSucceed'] = async ({
    request,
    response,
  }) => {
    if (this.options.type === 'list' || this.options.type === 'item') {
      if (response.status !== 200) {
        return response;
      }

      const tableName = this.options.tableName;
      const body = (await response.clone().json()) as DocsResponse | Doc;
      await DocsDB.cacheResponse(request.url, body, tableName);
    }

    return response;
  };

  /**
   * Means that the fetch failed (500 is not failed), so often it is a network error.
   */
  fetchDidFail: WorkboxPlugin['fetchDidFail'] = async () => {
    this.isFetchDidFailed = true;
    return Promise.resolve();
  };

  /**
   * This method is called before the request is made.
   * We can use it to capture the body of the request before it is sent.
   * A body sent get "used", and can't be read anymore.
   */
  requestWillFetch: WorkboxPlugin['requestWillFetch'] = async ({ request }) => {
    if (this.options.type === 'update') {
      this.initialRequest = request.clone();
    }

    await this.options.syncManager.sync();

    return Promise.resolve(request);
  };

  /**
   * When we get an network error.
   */
  handlerDidError: WorkboxPlugin['handlerDidError'] = async ({ request }) => {
    if (!this.isFetchDidFailed) {
      return Promise.resolve(ApiPlugin.getApiCatchHandler());
    }

    switch (this.options.type) {
      case 'update':
        return this.handlerDidErrorUpdate(request);
      case 'list':
      case 'item':
        return this.handlerDidErrorRead(this.options.tableName, request.url);
    }

    return Promise.resolve(ApiPlugin.getApiCatchHandler());
  };

  private handlerDidErrorUpdate = async (request: Request) => {
    const db = await DocsDB.open();
    const storedResponse = await db.get('doc-item', request.url);

    if (!storedResponse || !this.initialRequest) {
      return new Response('Not found', { status: 404 });
    }

    /**
     * Queue the request in the cache 'doc-mutation' to sync it later.
     */
    const requestData = (
      await RequestSerializer.fromRequest(this.initialRequest)
    ).toObject();

    const serializeRequest: DBRequest = {
      requestData,
      key: `${Date.now()}`,
    };

    await DocsDB.cacheResponse(
      serializeRequest.key,
      serializeRequest,
      'doc-mutation',
    );

    /**
     * Update the cache item with the new data.
     */
    const bodyMutate = (await this.initialRequest
      .clone()
      .json()) as Partial<Doc>;

    const newResponse = {
      ...storedResponse,
      ...bodyMutate,
    };

    await DocsDB.cacheResponse(request.url, newResponse, 'doc-item');

    /**
     * Update the cache list with the new data.
     */
    const listKeys = await db.getAllKeys('doc-list');

    // Get id from url
    const url = new URL(request.url);
    const docId = url.pathname.slice(0, -1).split('/').pop();

    for (const key of listKeys) {
      const list = await db.get('doc-list', key);

      if (!list) {
        continue;
      }

      list.results = list.results.map((result) => {
        if (result.id === docId) {
          result = {
            ...result,
            ...bodyMutate,
          };
        }
        return result;
      });

      await DocsDB.cacheResponse(key, list, 'doc-list');
    }

    db.close();

    /**
     * All is good for our client, we return the new response.
     */
    return new Response(JSON.stringify(newResponse), {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  private handlerDidErrorRead = async (
    tableName: OptionsReadonly['tableName'],
    url: string,
  ) => {
    const db = await DocsDB.open();
    const storedResponse = await db.get(tableName, url);

    if (!storedResponse) {
      return Promise.resolve(ApiPlugin.getApiCatchHandler());
    }

    return new Response(JSON.stringify(storedResponse), {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };
}
