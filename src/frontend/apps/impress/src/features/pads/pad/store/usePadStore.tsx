import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';
import { create } from 'zustand';

import { Pad } from '../types';

export interface PadStore {
  providers: { [padId: Pad['id']]: WebrtcProvider };
  createProvider: (padId: Pad['id']) => WebrtcProvider;
}

const initialState = {
  providers: {},
};

export const usePadStore = create<PadStore>((set) => ({
  providers: initialState.providers,
  createProvider: (padId: string) => {
    const provider = new WebrtcProvider(padId, new Y.Doc(), {
      signaling: [process.env.NEXT_PUBLIC_SIGNALING_URL || ''],
    });

    set(({ providers }) => {
      return {
        providers: {
          ...providers,
          [padId]: provider,
        },
      };
    });

    return provider;
  },
}));
