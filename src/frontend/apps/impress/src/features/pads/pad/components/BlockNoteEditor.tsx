import { BlockNoteView, useCreateBlockNote } from '@blocknote/react';
import '@blocknote/react/style.css';
import React, { useEffect, useState } from 'react';
import { WebrtcProvider } from 'y-webrtc';

import { Box } from '@/components';
import { useAuthStore } from '@/core/auth';

import { usePadStore } from '../stores';
import { Pad } from '../types';
import { randomColor } from '../utils';

interface BlockNoteEditorProps {
  pad: Pad;
}

export const BlockNoteEditor = ({ pad }: BlockNoteEditorProps) => {
  const { createProvider, padsStore } = usePadStore();
  const [provider, setProvider] = useState<WebrtcProvider>(
    padsStore?.[pad.id]?.provider,
  );

  useEffect(() => {
    if (provider) {
      return;
    }

    setProvider(createProvider(pad.id));
  }, [createProvider, pad.id, provider]);

  if (!provider) {
    return null;
  }

  return <BlockNoteContent pad={pad} provider={provider} />;
};

interface BlockNoteContentProps {
  pad: Pad;
  provider: WebrtcProvider;
}

export const BlockNoteContent = ({ pad, provider }: BlockNoteContentProps) => {
  const { userData } = useAuthStore();
  const { setEditor } = usePadStore();

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

  useEffect(() => {
    setEditor(pad.id, editor);
  }, [setEditor, pad.id, editor]);

  return (
    <Box
      $css={`
        &, & > .bn-container, & .ProseMirror {
          height:100%
        };
      `}
    >
      <BlockNoteView editor={editor} />
    </Box>
  );
};
