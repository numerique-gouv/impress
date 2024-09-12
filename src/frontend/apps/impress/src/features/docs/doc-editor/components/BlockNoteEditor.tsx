import { Block, BlockNoteEditor as BlockNoteEditorCore, PartialBlock } from '@blocknote/core';
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
import { useDocStore } from '../stores';
import { randomColor } from '../utils';

import { BlockNoteToolbar } from './BlockNoteToolbar';
import { useE2ESDKClient } from '@socialgouv/e2esdk-react';

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

  const e2eClient = useE2ESDKClient();
  const storedEditor = docsStore?.[storeId]?.editor;
  const {
    mutateAsync: createDocAttachment,
    isError: isErrorAttachment,
    error: errorAttachment,
  } = useCreateDocAttachment();

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

    // TODO decrypt doc.content
    //localStorage.getItem('KEY');

    const docId = doc.id;
    const purpose = `docs:${docId}`;
    const key = e2eClient.findKeyByPurpose(purpose);
    console.log('purpose', purpose, 'key', key);
    let plaintextContent: Array<PartialBlock> | undefined;
    if (!key) {
      alert('probleme de key');
      return;
    } else {
      if (doc.content) {
        plaintextContent = JSON.parse(e2eClient.decrypt(
          doc.content,
          key.keychainFingerprint,
        ) as string) as Array<PartialBlock>;

        console.log('decryptedMessage', plaintextContent);
      } else {
        plaintextContent = undefined;
      }
    }

    return BlockNoteEditorCore.create({
      // collaboration: {
      //   provider,
      //   fragment: provider.document.getXmlFragment('document-store'),
      //   user: {
      //     name: userData?.email || 'Anonymous',
      //     color: randomColor(),
      //   },
      // },
      uploadFile,
      initialContent: plaintextContent,
    });
  }, [doc.content, storedEditor, uploadFile]);

  console.log("useSaveDoc", doc.id, provider.document, canSave, editor);
  useSaveDoc(doc.id, provider.document, canSave, editor);

  useEffect(() => {
    setStore(storeId, { editor });
  }, [setStore, storeId, editor]);

  return (
    <Box $css={cssEditor}>
      {isErrorAttachment && (
        <Box $margin={{ bottom: 'big' }}>
          <TextErrors causes={errorAttachment.cause} />
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
