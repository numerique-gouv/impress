import { BlockNoteEditor } from '@blocknote/core';
import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';
import { create } from 'zustand';

import { signalingUrl } from '@/core';

import { Pad } from '../types';

export interface PadStore {
  padsStore: {
    [padId: Pad['id']]: {
      provider: WebrtcProvider;
      editor?: BlockNoteEditor;
    };
  };
  createProvider: (padId: Pad['id']) => WebrtcProvider;
  setEditor: (padId: Pad['id'], editor: BlockNoteEditor) => void;
}

const initialState = {
  padsStore: {},
};

export const usePadStore = create<PadStore>((set) => ({
  padsStore: initialState.padsStore,
  createProvider: (padId: string) => {
    const provider = new WebrtcProvider(padId, new Y.Doc(), {
      signaling: [signalingUrl()],
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
