import { BlockNoteEditor as BlockNoteEditorCore } from '@blocknote/core';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/react/style.css';
import React, { useEffect, useMemo } from 'react';
import { WebrtcProvider } from 'y-webrtc';

import { Box } from '@/components';
import { useAuthStore } from '@/core/auth';

import { usePadStore } from '../stores';
import { Pad } from '../types';
import { randomColor } from '../utils';

import { BlockNoteToolbar } from './BlockNoteToolbar';

interface BlockNoteEditorProps {
  pad: Pad;
}

export const BlockNoteEditor = ({ pad }: BlockNoteEditorProps) => {
  const { createProvider, padsStore } = usePadStore();
  const provider = padsStore?.[pad.id]?.provider;

  if (!provider) {
    createProvider(pad.id);
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
  const { setEditor, padsStore } = usePadStore();

  const storedEditor = padsStore?.[pad.id]?.editor;
  const editor = useMemo(() => {
    if (storedEditor) {
      return storedEditor;
    }

    return BlockNoteEditorCore.create({
      collaboration: {
        provider,
        fragment: provider.doc.getXmlFragment('document-store'),
        user: {
          name: userData?.name || userData?.email || 'Anonymous',
          color: randomColor(),
        },
      },
    });
  }, [provider, storedEditor, userData?.email, userData?.name]);

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
      <BlockNoteView editor={editor} formattingToolbar={false}>
        <BlockNoteToolbar />
      </BlockNoteView>
    </Box>
  );
};
