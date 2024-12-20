import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { create } from 'zustand';

import { CollaborationUrl } from '@/core/config';
import { Base64, base64ToYDoc } from '@/features/docs/doc-management';
import { isEdge, isFirefox } from '@/utils';

import { toBase64 } from '../../doc-editor';
import { syncDocPolling } from '../api/';

export interface UseCollaborationStore {
  createProvider: (
    providerUrl: CollaborationUrl,
    storeId: string,
    initialDoc?: Base64,
  ) => HocuspocusProvider;
  destroyProvider: () => void;
  failureCount: number;
  maxFailureCount: number;
  provider: HocuspocusProvider | undefined;
  pollRequest: (poolUrl: string) => Promise<void>;
  withPolling: boolean;
}

const defaultValues = {
  failureCount: 0,
  maxFailureCount: 4,
  provider: undefined,
  withPolling: false,
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
          withPolling: false,
        });
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
          set({
            withPolling: true,
          });
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

    set({
      provider,
    });

    return provider;
  },
  destroyProvider: () => {
    const provider = get().provider;
    if (provider) {
      provider.destroy();
    }

    set({
      withPolling: defaultValues.withPolling,
      provider: defaultValues.provider,
    });
  },
  pollRequest: async (pollUrl) => {
    const provider = get().provider;

    if (!provider) {
      return;
    }

    console.log('Start polling');

    const { yDoc64 } = await syncDocPolling({
      pollUrl,
      yDoc64: toBase64(Y.encodeStateAsUpdate(provider.document)),
    });

    if (!yDoc64) {
      return;
    }

    const yDoc = base64ToYDoc(yDoc64);
    Y.applyUpdate(provider.document, Y.encodeStateAsUpdate(yDoc));
  },
}));
