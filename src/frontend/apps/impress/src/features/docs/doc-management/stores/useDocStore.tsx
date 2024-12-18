import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { create } from 'zustand';

import { Base64, Doc, base64ToYDoc } from '@/features/docs/doc-management';
import { isFirefox } from '@/utils';

import { toBase64 } from '../../doc-editor';

export interface UseDocStore {
  currentDoc?: Doc;
  providers: {
    [storeId: string]: HocuspocusProvider;
  };
  createProvider: (
    providerUrl: string,
    storeId: string,
    initialDoc: Base64,
  ) => HocuspocusProvider;
  setProviders: (storeId: string, providers: HocuspocusProvider) => void;
  setCurrentDoc: (doc: Doc | undefined) => void;
  setPool: (storeId: string, provider: HocuspocusProvider) => void;
  pools: {
    [storeId: string]: boolean;
  };
}

export const useDocStore = create<UseDocStore>((set, get) => ({
  currentDoc: undefined,
  pools: {},
  providers: {},
  createProvider: (providerUrl, storeId, initialDoc) => {
    const doc = new Y.Doc({
      guid: storeId,
    });

    if (initialDoc) {
      Y.applyUpdate(doc, Buffer.from(initialDoc, 'base64'));
    }

    const wsUrl = isFirefox()
      ? 'ws://localhost:4444/collaboration/ws/?room=' + storeId
      : 'ws://localhost:6666';
    const provider = new HocuspocusProvider({
      url: wsUrl,
      name: storeId,
      document: doc,
      onAuthenticationFailed: () => {
        console.error('Authentication failed');
      },
      onClose: () => {
        console.log('Provider closed');
      },
      onDisconnect: () => {
        console.log('Provider disconnected');
      },
      onDestroy() {
        console.log('Provider destroyed');
      },
    });

    if (!isFirefox()) {
      get().setPool(storeId, provider);
    }
    get().setProviders(storeId, provider);

    return provider;
  },
  setPool: (storeId, provider) => {
    if (get().pools[storeId]) {
      return;
    }

    set(({ pools }) => ({
      pools: {
        ...pools,
        [storeId]: true,
      },
    }));

    setInterval(() => {
      fetch('http://localhost:4444/collaboration/pool/?room=' + storeId, {
        method: 'POST',
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
          console.error('Error:', error);
        });
    }, 1500);
  },
  setProviders: (storeId, provider) => {
    set(({ providers }) => ({
      providers: {
        ...providers,
        [storeId]: provider,
      },
    }));
  },
  setCurrentDoc: (doc) => {
    set({ currentDoc: doc });
  },
}));
