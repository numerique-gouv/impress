import { BlockNoteEditor } from '@blocknote/core';
import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';
import { create } from 'zustand';

import { signalingUrl } from '@/core';
import { Base64, Pad } from '@/features/pads/pad-management';

export interface PadStore {
  padsStore: {
    [padId: Pad['id']]: {
      provider: WebrtcProvider;
      editor?: BlockNoteEditor;
    };
  };
  createProvider: (padId: Pad['id'], initialDoc: Base64) => WebrtcProvider;
  setEditor: (padId: Pad['id'], editor: BlockNoteEditor) => void;
}

const initialState = {
  padsStore: {},
};

export const usePadStore = create<PadStore>((set) => ({
  padsStore: initialState.padsStore,
  createProvider: (padId: string, initialDoc: Base64) => {
    const doc = new Y.Doc();

    if (initialDoc) {
      Y.applyUpdate(doc, Buffer.from(initialDoc, 'base64'));
    }

    const provider = new WebrtcProvider(padId, doc, {
      signaling: [signalingUrl(padId)],
      maxConns: 5,
    });

    set(({ padsStore }) => {
      return {
        padsStore: {
          ...padsStore,
          [padId]: {
            provider,
          },
        },
      };
    });

    return provider;
  },
  setEditor: (padId, editor) => {
    set(({ padsStore }) => {
      return {
        padsStore: {
          ...padsStore,
          [padId]: {
            ...padsStore[padId],
            editor,
          },
        },
      };
    });
  },
}));
