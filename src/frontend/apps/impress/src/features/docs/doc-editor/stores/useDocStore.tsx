import { BlockNoteEditor } from '@blocknote/core';
import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';
import { create } from 'zustand';

import { signalingUrl } from '@/core';
import { Base64 } from '@/features/docs/doc-management';

interface DocStore {
  provider: WebrtcProvider;
  editor?: BlockNoteEditor;
}

type ForceSaveState = 'false' | 'version' | 'current';

export interface UseDocStore {
  docsStore: {
    [storeId: string]: DocStore;
  };
  createProvider: (storeId: string, initialDoc: Base64) => WebrtcProvider;
  setStore: (storeId: string, props: Partial<DocStore>) => void;
  forceSave: ForceSaveState;
  setForceSave: (forceSave: ForceSaveState) => void;
}

export const useDocStore = create<UseDocStore>((set, get) => ({
  docsStore: {},
  forceSave: 'false',
  setForceSave: (forceSave) => {
    set(() => ({ forceSave }));
  },
  createProvider: (storeId: string, initialDoc: Base64) => {
    const doc = new Y.Doc({
      guid: storeId,
    });

    if (initialDoc) {
      Y.applyUpdate(doc, Buffer.from(initialDoc, 'base64'));
    }

    const provider = new WebrtcProvider(storeId, doc, {
      signaling: [signalingUrl(storeId)],
      maxConns: 5,
    });

    get().setStore(storeId, { provider });

    return provider;
  },
  setStore: (storeId, props) => {
    set(({ docsStore }) => {
      return {
        docsStore: {
          ...docsStore,
          [storeId]: {
            ...docsStore[storeId],
            ...props,
          },
        },
      };
    });
  },
}));
