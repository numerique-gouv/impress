import { BlockNoteEditor as BlockNoteEditorCore } from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { HocuspocusProvider } from '@hocuspocus/provider';
import React, { useCallback, useEffect, useMemo } from 'react';

import { Box, TextErrors } from '@/components';
import { mediaUrl } from '@/core';
import { useAuthStore } from '@/core/auth';
import { Doc } from '@/features/docs/doc-management';
import { Version } from '@/features/docs/doc-versioning/';

import { useCreateDocAttachment } from '../api/useCreateDocUpload';
import useSaveDoc from '../hook/useSaveDoc';
import { useDocStore, useHeadingStore } from '../stores';
import { randomColor } from '../utils';

import { BlockNoteToolbar } from './BlockNoteToolbar';

const cssEditor = `
  &, & > .bn-container, & .ProseMirror {
    height:100%
  };
  & .collaboration-cursor__caret.ProseMirror-widget{
    word-wrap: initial;
  }
  & .bn-inline-content code {
    background-color: gainsboro;
    padding: 2px;
    border-radius: 4px;
  }
`;

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
    if (!provider || provider.document.guid !== storeId) {
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
  provider: HocuspocusProvider;
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
  useSaveDoc(doc.id, provider.document, canSave);
  const storedEditor = docsStore?.[storeId]?.editor;
  const {
    mutateAsync: createDocAttachment,
    isError: isErrorAttachment,
    error: errorAttachment,
  } = useCreateDocAttachment();
  const { setHeadings, resetHeadings } = useHeadingStore();

  const uploadFile = useCallback(
    async (file: File) => {
      const body = new FormData();
      body.append('file', file);

      const ret = await createDocAttachment({
        docId: doc.id,
        body,
      });

      return `${mediaUrl()}${ret.file}`;
    },
    [createDocAttachment, doc.id],
  );

  const editor = useMemo(() => {
    if (storedEditor) {
      return storedEditor;
    }

    return BlockNoteEditorCore.create({
      collaboration: {
        provider,
        fragment: provider.document.getXmlFragment('document-store'),
        user: {
          name: userData?.email || 'Anonymous',
          color: randomColor(),
        },
      },
      uploadFile,
    });
  }, [provider, storedEditor, uploadFile, userData?.email]);

  useEffect(() => {
    setStore(storeId, { editor });
  }, [setStore, storeId, editor]);

  useEffect(() => {
    setHeadings(editor);

    editor?.onEditorContentChange(() => {
      setHeadings(editor);
    });

    return () => {
      resetHeadings();
    };
  }, [editor, resetHeadings, setHeadings]);

  return (
    <Box $css={cssEditor}>
      {isErrorAttachment && (
        <Box $margin={{ bottom: 'big' }}>
          <TextErrors
            causes={errorAttachment.cause}
            canClose
            $textAlign="left"
          />
        </Box>
      )}

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
