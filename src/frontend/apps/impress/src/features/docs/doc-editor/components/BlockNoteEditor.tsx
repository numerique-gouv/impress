import { BlockNoteEditor as BlockNoteEditorCore } from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import React, { useEffect, useMemo } from 'react';
import { WebrtcProvider } from 'y-webrtc';

import { Box } from '@/components';
import { useAuthStore } from '@/core/auth';
import { Doc } from '@/features/docs/doc-management';

import useSaveDoc from '../hook/useSaveDoc';
import { useDocStore } from '../stores';
import { randomColor } from '../utils';

import { BlockNoteToolbar } from './BlockNoteToolbar';

interface BlockNoteEditorProps {
  doc: Doc;
}

export const BlockNoteEditor = ({ doc }: BlockNoteEditorProps) => {
  const { createProvider, docsStore } = useDocStore();
  const provider = docsStore?.[doc.id]?.provider;

  if (!provider) {
    createProvider(doc.id, doc.content);
    return null;
  }

  return <BlockNoteContent doc={doc} provider={provider} />;
};

interface BlockNoteContentProps {
  doc: Doc;
  provider: WebrtcProvider;
}

export const BlockNoteContent = ({ doc, provider }: BlockNoteContentProps) => {
  const { userData } = useAuthStore();
  const { setEditor, docsStore } = useDocStore();
  useSaveDoc(doc.id, provider.doc, doc.abilities.partial_update);

  const storedEditor = docsStore?.[doc.id]?.editor;
  const editor = useMemo(() => {
    if (storedEditor) {
      return storedEditor;
    }

    return BlockNoteEditorCore.create({
      collaboration: {
        provider,
        fragment: provider.doc.getXmlFragment('document-store'),
        user: {
          name: userData?.email || 'Anonymous',
          color: randomColor(),
        },
      },
    });
  }, [provider, storedEditor, userData?.email]);

  useEffect(() => {
    setEditor(doc.id, editor);
  }, [setEditor, doc.id, editor]);

  return (
    <Box
      $css={`
        &, & > .bn-container, & .ProseMirror {
          height:100%
        };
        & .collaboration-cursor__caret.ProseMirror-widget{
          word-wrap: initial;
        }
      `}
    >
      <BlockNoteView
        editor={editor}
        formattingToolbar={false}
        editable={doc.abilities.partial_update}
      >
        <BlockNoteToolbar />
      </BlockNoteView>
    </Box>
  );
};
