import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { create } from 'zustand';

import { Base64, Doc } from '@/features/docs/doc-management';

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
}

export const useDocStore = create<UseDocStore>((set, get) => ({
  currentDoc: undefined,
  providers: {},
  createProvider: (providerUrl, storeId, initialDoc) => {
    const doc = new Y.Doc({
      guid: storeId,
    });

    if (initialDoc) {
      Y.applyUpdate(doc, Buffer.from(initialDoc, 'base64'));
    }

    const provider = new HocuspocusProvider({
      url: providerUrl,
      name: storeId,
      document: doc,
    });

    get().setProviders(storeId, provider);

    return provider;
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
