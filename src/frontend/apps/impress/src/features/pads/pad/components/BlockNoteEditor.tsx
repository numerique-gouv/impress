import { BlockNoteView, useCreateBlockNote } from '@blocknote/react';
import '@blocknote/react/style.css';
import React, { useCallback } from 'react';

import { useAuthStore } from '@/core/auth';

import { PadStore, usePadStore } from '../store';
import { Pad } from '../types';
import { randomColor } from '../utils';

interface BlockNoteEditorProps {
  pad: Pad;
}

export const BlockNoteEditor = ({ pad }: BlockNoteEditorProps) => {
  const { userData } = useAuthStore();
  const getProvider = useCallback(
    (state: PadStore) => {
      if (!state.providers[pad.id]) {
        return state.createProvider(pad.id);
      }

      return state.providers[pad.id];
    },
    [pad.id],
  );

  const provider = usePadStore(getProvider);

  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment: provider.doc.getXmlFragment('document-store'),
      user: {
        name: userData?.name || userData?.email || 'Anonymous',
        color: randomColor(),
      },
    },
  });

  return <BlockNoteView editor={editor} />;
};
