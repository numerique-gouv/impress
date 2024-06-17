import { DBSchema, openDB } from 'idb';
import { WorkboxPlugin } from 'workbox-core';

import { Doc, DocsResponse } from '@/features/docs';

import { getApiCatchHandler } from './utils';

interface DocsDB extends DBSchema {
  'doc-list': {
    key: string;
    value: DocsResponse;
  };
  'doc-item': {
    key: string;
    value: Doc;
  };
}

export interface OptionsReadonly {
  tableName: 'doc-list' | 'doc-item';
  type: 'list' | 'item';
}

export interface OptionsMutate {
  type: 'update' | 'delete' | 'create';
}

export type Options = OptionsReadonly | OptionsMutate;

export class ApiPlugin implements WorkboxPlugin {
  private static readonly DBNAME = 'api-docs-db';
  private readonly options: Options;
  private isFetchDidFailed = false;

  constructor(options: Options) {
    this.options = options;
  }

  /**
   * Save the response in the IndexedDB.
   */
  private async cacheResponse(
    request: Request,
    body: DocsResponse | Doc,
    tableName: OptionsReadonly['tableName'],
  ): Promise<void> {
    const db = await openDB<DocsDB>(ApiPlugin.DBNAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('doc-list')) {
          db.createObjectStore('doc-list');
        }
        if (!db.objectStoreNames.contains('doc-item')) {
          db.createObjectStore('doc-item');
        }
      },
    });

    await db.put(tableName, body, request.url);
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
        await this.cacheResponse(request, body, tableName);
      } catch (error) {
        console.error(
          'Failed to save response in IndexedDB',
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
   * When we get an network error.
   */
  handlerDidError: WorkboxPlugin['handlerDidError'] = async ({ request }) => {
    if (!this.isFetchDidFailed) {
      return Promise.resolve(getApiCatchHandler());
    }

    /**
     * Get data from the cache.
     */
    if (this.options.type === 'list' || this.options.type === 'item') {
      return this.handlerDidErrorRead(this.options.tableName, request.url);
    }

    return Promise.resolve(getApiCatchHandler());
  };

  handlerDidErrorRead = async (
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
}
