import { BlockNoteEditor } from '@blocknote/core';
import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';
import { create } from 'zustand';

import { signalingUrl } from '@/core';
import { Base64, Doc } from '@/features/docs/doc-management';

export interface DocStore {
  docsStore: {
    [docId: Doc['id']]: {
      provider: WebrtcProvider;
      editor?: BlockNoteEditor;
    };
  };
  createProvider: (docId: Doc['id'], initialDoc: Base64) => WebrtcProvider;
  setEditor: (docId: Doc['id'], editor: BlockNoteEditor) => void;
}

const initialState = {
  docsStore: {},
};

export const useDocStore = create<DocStore>((set) => ({
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

    set(({ docsStore }) => {
      return {
        docsStore: {
          ...docsStore,
          [docId]: {
            provider,
          },
        },
      };
    });

    return provider;
  },
  setEditor: (docId, editor) => {
    set(({ docsStore }) => {
      return {
        docsStore: {
          ...docsStore,
          [docId]: {
            ...docsStore[docId],
            editor,
          },
        },
      };
    });
  },
}));
