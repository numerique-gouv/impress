import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { create } from 'zustand';

import { CollaborationUrl } from '@/core/config';
import { Base64, base64ToYDoc } from '@/features/docs/doc-management';
import { isEdge, isFirefox } from '@/utils';

import { toBase64 } from '../../doc-editor';

export interface UseCollaborationStore {
  provider: HocuspocusProvider | undefined;
  failureCount: number;
  maxFailureCount: number;
  createProvider: (
    providerUrl: CollaborationUrl,
    storeId: string,
    initialDoc?: Base64,
  ) => HocuspocusProvider;
  destroyProvider: () => void;
  pollingInterval?: NodeJS.Timeout;
  setProvider: (providers?: HocuspocusProvider) => void;
  startPooling: (poolUrl: string, provider: HocuspocusProvider) => void;
  stopPolling: () => void;
}

const defaultValues = {
  pools: {},
  provider: undefined,
  maxFailureCount: 4,
  failureCount: 0,
  pollingInterval: undefined,
};

export const useProviderStore = create<UseCollaborationStore>((set, get) => ({
  ...defaultValues,
  createProvider: (providerUrl, storeId, initialDoc) => {
    const doc = new Y.Doc({
      guid: storeId,
    });

    if (initialDoc) {
      Y.applyUpdate(doc, Buffer.from(initialDoc, 'base64'));
    }

    console.log('navigator.userAgent', navigator.userAgent);
    console.log('providerUrl', providerUrl);
    const withWS = isFirefox();
    //const withWS = true;
    const wsUrl = withWS
      ? providerUrl.wsUrl //'ws://localhost:4444/collaboration/ws/?room=' + storeId
      : 'ws://localhost:6666';

    const provider = new HocuspocusProvider({
      url: wsUrl,
      name: storeId,
      document: doc,
      onConnect: () => {
        console.log('Provider connected');
        set({
          failureCount: 0,
        });

        get().stopPolling();
      },
      onAuthenticationFailed: () => {
        console.error('Authentication failed');
      },
      onClose: () => {
        set({
          failureCount: get().failureCount + 1,
        });

        if (get().failureCount > get().maxFailureCount) {
          console.error('Max failure count reached');
          get().startPooling(providerUrl.poolUrl, provider);
        }
        console.log('Provider closed');
      },
      onDisconnect: () => {
        console.log('Provider disconnected');
      },
      onDestroy() {
        console.log('Provider destroyed');
      },
    });

    get().setProvider(provider);

    return provider;
  },
  destroyProvider: () => {
    const provider = get().provider;
    if (provider) {
      provider.destroy();
      get().setProvider(undefined);
      get().stopPolling();
    }
  },
  stopPolling: () => {
    const pollingInterval = get().pollingInterval;
    clearInterval(pollingInterval);
  },
  startPooling: (poolUrl, provider) => {
    const isAlreadyPolling = !!get().pollingInterval;
    if (isAlreadyPolling) {
      return;
    }

    console.log('Setting poolUrl: ', poolUrl);

    const pollingInterval = setInterval(() => {
      fetch(poolUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          yDoc64: toBase64(Y.encodeStateAsUpdate(provider.document)),
        }),
      })
        .then(async (response) => {
          if (response.ok) {
            const { yDoc64 } = (await response.json()) as {
              yDoc64?: string;
            };

            if (!yDoc64) {
              return;
            }

            const yDoc = base64ToYDoc(yDoc64);
            Y.applyUpdate(provider.document, Y.encodeStateAsUpdate(yDoc));
          }
        })
        .catch((error) => {
          console.error('Error pooling:', error);
        });
    }, 1500);

    set({
      pollingInterval,
    });
  },
  setProvider: (provider) => {
    set({
      provider,
    });
  },
}));
