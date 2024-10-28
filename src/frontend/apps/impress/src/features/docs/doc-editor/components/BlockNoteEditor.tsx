import { locales } from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { useCreateBlockNote } from '@blocknote/react';
import { HocuspocusProvider } from '@hocuspocus/provider';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, TextErrors } from '@/components';
import { mediaUrl } from '@/core';
import { useAuthStore } from '@/core/auth';
import { blockNoteSchema } from '@/features/docs';
import { SuggestionMenuEditor } from '@/features/docs/doc-editor/components/custom-blocks/suggestion-menu/SuggestionMenuEditor';
import { Doc } from '@/features/docs/doc-management';
import { Version } from '@/features/docs/doc-versioning/';

import { useCreateDocAttachment } from '../api/useCreateDocUpload';
import useSaveDoc from '../hook/useSaveDoc';
import { useDocStore, useHeadingStore } from '../stores';
import { randomColor } from '../utils';

import { BlockNoteToolbar } from './BlockNoteToolbar';

const cssEditor = (readonly: boolean) => `
  &, & > .bn-container, & .ProseMirror {
    height:100%
  };
  & .bn-editor {
    padding-right: 30px;
    ${readonly && `padding-left: 30px;`}
  };
  & .collaboration-cursor__caret.ProseMirror-widget{
    word-wrap: initial;
  }
  & .bn-inline-content code {
    background-color: gainsboro;
    padding: 2px;
    border-radius: 4px;
  }
  @media screen and (width <= 560px) {
    & .bn-editor {
      padding-left: 40px;
      padding-right: 10px;
      ${readonly && `padding-left: 10px;`}
    };
    .bn-side-menu[data-block-type=heading][data-level="1"] {
        height: 46px;
    }
    .bn-side-menu[data-block-type=heading][data-level="2"] {
      height: 40px;
    }
    .bn-side-menu[data-block-type=heading][data-level="3"] {
      height: 40px;
    }
    & .bn-editor h1 {
      font-size: 1.6rem;
    }
    & .bn-editor h2 {
      font-size: 1.35rem;
    }
    & .bn-editor h3 {
      font-size: 1.2rem;
    }
    .bn-block-content[data-is-empty-and-focused][data-content-type="paragraph"] 
      .bn-inline-content:has(> .ProseMirror-trailingBreak:only-child)::before {
      font-size: 14px;
    }
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

  const readOnly = !doc.abilities.partial_update || isVersion;
  useSaveDoc(doc.id, provider.document, !readOnly);
  const storedEditor = docsStore?.[storeId]?.editor;
  const {
    mutateAsync: createDocAttachment,
    isError: isErrorAttachment,
    error: errorAttachment,
  } = useCreateDocAttachment();
  const { setHeadings, resetHeadings } = useHeadingStore();
  const { i18n } = useTranslation();
  const lang = i18n.language;

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

  const editor = useCreateBlockNote(
    {
      schema: blockNoteSchema,
      collaboration: {
        provider,
        fragment: provider.document.getXmlFragment('document-store'),
        user: {
          name: userData?.email || 'Anonymous',
          color: randomColor(),
        },
      },
      dictionary: locales[lang as keyof typeof locales],
      uploadFile,
    },
    [provider, uploadFile, userData?.email, lang],
  );

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

  const goodEditor = storedEditor ?? editor;

  return (
    <>
      <Box $css={cssEditor(readOnly)}>
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
          editor={goodEditor}
          slashMenu={false}
          formattingToolbar={false}
          editable={!readOnly}
          theme="light"
        >
          <SuggestionMenuEditor editor={goodEditor} />
          <BlockNoteToolbar />
        </BlockNoteView>
      </Box>
    </>
  );
};
