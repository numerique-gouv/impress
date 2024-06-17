import { DBSchema, openDB } from 'idb';
import { WorkboxPlugin } from 'workbox-core';

import { Doc, DocsResponse } from '@/features/docs';

import { RequestData, RequestSerializer } from './RequestSerializer';
import { SyncManager } from './SyncManager';
import { getApiCatchHandler } from './utils';

type DBRequest = {
  requestData: RequestData;
  key: string;
};

interface DocsDB extends DBSchema {
  'doc-list': {
    key: string;
    value: DocsResponse;
  };
  'doc-item': {
    key: string;
    value: Doc;
  };
  'doc-mutation': {
    key: string;
    value: DBRequest;
  };
}

interface OptionsReadonly {
  tableName: 'doc-list' | 'doc-item';
  type: 'list' | 'item';
}

interface OptionsMutate {
  tableName: 'doc-mutation';
  type: 'update' | 'delete' | 'create';
}

type Options = (OptionsReadonly | OptionsMutate) & { syncManager: SyncManager };

export class ApiPlugin implements WorkboxPlugin {
  private static readonly DBNAME = 'api-docs-db';
  private readonly options: Options;
  private isFetchDidFailed = false;
  private initialRequest?: Request;

  constructor(options: Options) {
    this.options = options;
  }

  /**
   * Save the response in the IndexedDB.
   */
  private async cacheResponse(
    key: string,
    body: DocsResponse | Doc | DBRequest,
    tableName: Options['tableName'],
  ): Promise<void> {
    const db = await ApiPlugin.DB();

    await db.put(tableName, body, key);
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

      try {
        const tableName = this.options.tableName;
        const body = (await response.clone().json()) as DocsResponse | Doc;
        await this.cacheResponse(request.url, body, tableName);
      } catch (error) {
        console.error(
          'SW-DEV: Failed to save response in IndexedDB',
          error,
          this.options,
        );
      }
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
      return Promise.resolve(getApiCatchHandler());
    }

    /**
     * Update the cache item to sync it later.
     */
    if (this.options.type === 'update') {
      return this.handlerDidErrorUpdate(request);
    }

    /**
     * Get data from the cache.
     */
    if (this.options.type === 'list' || this.options.type === 'item') {
      return this.handlerDidErrorRead(this.options.tableName, request.url);
    }

    return Promise.resolve(getApiCatchHandler());
  };

  private handlerDidErrorUpdate = async (request: Request) => {
    const db = await openDB<DocsDB>(ApiPlugin.DBNAME, 1);
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

    await this.cacheResponse(
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

    await db.put('doc-item', newResponse, request.url);

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

      await db.put('doc-list', list, key);
    }

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
    const db = await openDB<DocsDB>(ApiPlugin.DBNAME, 1);
    const storedResponse = await db.get(tableName, url);

    if (!storedResponse) {
      return Promise.resolve(getApiCatchHandler());
    }

    return new Response(JSON.stringify(storedResponse), {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  public static hasSyncToDo = async () => {
    const db = await ApiPlugin.DB();
    const requests = await db.getAll('doc-mutation');

    return requests.length > 0;
  };

  /**
   * Sync the queue with the server.
   */
  public static sync = async () => {
    const db = await ApiPlugin.DB();
    const requests = await db.getAll('doc-mutation');

    for (const request of requests) {
      try {
        await fetch(new RequestSerializer(request.requestData).toRequest());
        await db.delete('doc-mutation', request.key);
      } catch (error) {
        console.error('SW-DEV: Replay failed for request', request, error);
        break;
      }
    }
  };

  /**
   * IndexedDB instance.
   * @returns Promise<IDBPDatabase<DocsDB>>
   */
  private static DB = async () => {
    return await openDB<DocsDB>(ApiPlugin.DBNAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('doc-list')) {
          db.createObjectStore('doc-list');
        }
        if (!db.objectStoreNames.contains('doc-item')) {
          db.createObjectStore('doc-item');
        }
        if (!db.objectStoreNames.contains('doc-mutation')) {
          db.createObjectStore('doc-mutation');
        }
      },
    });
  };
}
