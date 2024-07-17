import { BlockNoteEditor as BlockNoteEditorCore } from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import React, { useEffect, useMemo } from 'react';
import { WebrtcProvider } from 'y-webrtc';

import { Box } from '@/components';
import { useAuthStore } from '@/core/auth';
import { Doc } from '@/features/docs/doc-management';
import { Version } from '@/features/docs/doc-versioning/';

import useSaveDoc from '../hook/useSaveDoc';
import { useDocStore } from '../stores';
import { randomColor } from '../utils';

import { BlockNoteToolbar } from './BlockNoteToolbar';

interface BlockNoteEditorProps {
  doc: Doc;
  version?: Version;
}

export const BlockNoteEditor = ({ doc, version }: BlockNoteEditorProps) => {
  const { createProvider, docsStore } = useDocStore();
  const storeId = version?.id || doc.id;
  const initialContent = version?.content || doc.content;
  const provider = docsStore?.[storeId]?.provider;

  useEffect(() => {
    if (!provider || provider.doc.guid !== storeId) {
      createProvider(storeId, initialContent);
    }
  }, [createProvider, initialContent, provider, storeId]);

  if (!provider) {
    return null;
  }

  return <BlockNoteContent doc={doc} provider={provider} storeId={storeId} />;
};

interface BlockNoteContentProps {
  doc: Doc;
  provider: WebrtcProvider;
  storeId: string;
}

export const BlockNoteContent = ({
  doc,
  provider,
  storeId,
}: BlockNoteContentProps) => {
  const isVersion = doc.id !== storeId;
  const { userData } = useAuthStore();
  const { setStore, docsStore } = useDocStore();
  const canSave = doc.abilities.partial_update && !isVersion;
  useSaveDoc(doc.id, provider.doc, canSave);

  const storedEditor = docsStore?.[storeId]?.editor;
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
    setStore(storeId, { editor });
  }, [setStore, storeId, editor]);

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
        editable={doc.abilities.partial_update && !isVersion}
        theme="light"
      >
        <BlockNoteToolbar />
      </BlockNoteView>
    </Box>
  );
};
