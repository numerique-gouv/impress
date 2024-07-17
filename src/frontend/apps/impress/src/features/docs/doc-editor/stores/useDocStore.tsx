import { BlockNoteEditor } from '@blocknote/core';
import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';
import { create } from 'zustand';

import { signalingUrl } from '@/core';
import { Base64, Doc } from '@/features/docs/doc-management';

interface DocStore {
  provider: WebrtcProvider;
  editor?: BlockNoteEditor;
}

export interface UseDocStore {
  docsStore: {
    [docId: Doc['id']]: DocStore;
  };
  createProvider: (docId: Doc['id'], initialDoc: Base64) => WebrtcProvider;
  setStore: (docId: Doc['id'], props: Partial<DocStore>) => void;
}

const initialState = {
  docsStore: {},
};

export const useDocStore = create<UseDocStore>((set, get) => ({
  docsStore: initialState.docsStore,
  createProvider: (docId: string, initialDoc: Base64) => {
    const doc = new Y.Doc({
      guid: docId,
    });

    if (initialDoc) {
      Y.applyUpdate(doc, Buffer.from(initialDoc, 'base64'));
    }

    const provider = new WebrtcProvider(docId, doc, {
      signaling: [signalingUrl(docId)],
      maxConns: 5,
    });

    get().setStore(docId, { provider });

    return provider;
  },
  setStore: (docId, props) => {
    set(({ docsStore }) => {
      return {
        docsStore: {
          ...docsStore,
          [docId]: {
            ...docsStore[docId],
            ...props,
          },
        },
      };
    });
  },
}));
