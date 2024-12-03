import {
  Button,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, DropButton, IconOptions } from '@/components';
import { useAuthStore } from '@/core';
import {
  useEditorStore,
  usePanelEditorStore,
} from '@/features/docs/doc-editor/';
import {
  Doc,
  ModalRemoveDoc,
  ModalShare,
} from '@/features/docs/doc-management';
import { ModalVersion } from '@/features/docs/doc-versioning';
import { useResponsiveStore } from '@/stores';

import { ModalPDF } from './ModalExport';

interface DocToolBoxProps {
  doc: Doc;
}

export const DocToolBox = ({ doc }: DocToolBoxProps) => {
  const {
    query: { versionId },
  } = useRouter();
  const { t } = useTranslation();
  const [isModalShareOpen, setIsModalShareOpen] = useState(false);
  const [isModalRemoveOpen, setIsModalRemoveOpen] = useState(false);
  const [isModalPDFOpen, setIsModalPDFOpen] = useState(false);
  const [isDropOpen, setIsDropOpen] = useState(false);
  const { setIsPanelOpen, setIsPanelTableContentOpen } = usePanelEditorStore();
  const [isModalVersionOpen, setIsModalVersionOpen] = useState(false);
  const { isSmallMobile } = useResponsiveStore();
  const { authenticated } = useAuthStore();
  const { editor } = useEditorStore();
  const { toast } = useToastProvider();

  const copyCurrentEditorToClipboard = async (
    asFormat: 'html' | 'markdown',
  ) => {
    if (!editor) {
      toast(t('Editor unavailable'), VariantType.ERROR, { duration: 3000 });
      return;
    }

    try {
      const editorContentFormatted =
        asFormat === 'html'
          ? await editor.blocksToHTMLLossy()
          : await editor.blocksToMarkdownLossy();
      await navigator.clipboard.writeText(editorContentFormatted);
      toast(t('Copied to clipboard'), VariantType.SUCCESS, { duration: 3000 });
    } catch (error) {
      console.error(error);
      toast(t('Failed to copy to clipboard'), VariantType.ERROR, {
        duration: 3000,
      });
    }
  };

  return (
    <Box
      $margin={{ left: 'auto' }}
      $direction="row"
      $align="center"
      $gap="0.5rem 1.5rem"
      $wrap={isSmallMobile ? 'wrap' : 'nowrap'}
    >
      {versionId && (
        <Box $margin={{ left: 'auto' }}>
          <Button
            onClick={() => {
              setIsModalVersionOpen(true);
            }}
            color="secondary"
            size={isSmallMobile ? 'small' : 'medium'}
          >
            {t('Restore this version')}
          </Button>
        </Box>
      )}
      <Box $direction="row" $margin={{ left: 'auto' }} $gap="1rem">
        {authenticated && (
          <Button
            onClick={() => {
              setIsModalShareOpen(true);
            }}
            size={isSmallMobile ? 'small' : 'medium'}
          >
            {t('Share')}
          </Button>
        )}
        <DropButton
          button={
            <IconOptions
              isOpen={isDropOpen}
              aria-label={t('Open the document options')}
            />
          }
          onOpenChange={(isOpen) => setIsDropOpen(isOpen)}
          isOpen={isDropOpen}
        >
          <Box>
            {doc.abilities.versions_list && (
              <Button
                onClick={() => {
                  setIsPanelOpen(true);
                  setIsPanelTableContentOpen(false);
                  setIsDropOpen(false);
                }}
                color="primary-text"
                icon={<span className="material-icons">history</span>}
                size="small"
              >
                {t('Version history')}
              </Button>
            )}
            <Button
              onClick={() => {
                setIsPanelOpen(true);
                setIsPanelTableContentOpen(true);
                setIsDropOpen(false);
              }}
              color="primary-text"
              icon={<span className="material-icons">summarize</span>}
              size="small"
            >
              {t('Table of contents')}
            </Button>
            <Button
              onClick={() => {
                setIsModalPDFOpen(true);
                setIsDropOpen(false);
              }}
              color="primary-text"
              icon={<span className="material-icons">file_download</span>}
              size="small"
            >
              {t('Export')}
            </Button>
            {doc.abilities.destroy && (
              <Button
                onClick={() => {
                  setIsModalRemoveOpen(true);
                  setIsDropOpen(false);
                }}
                color="primary-text"
                icon={<span className="material-icons">delete</span>}
                size="small"
              >
                {t('Delete document')}
              </Button>
            )}
            <Button
              onClick={() => {
                setIsDropOpen(false);
                void copyCurrentEditorToClipboard('markdown');
              }}
              color="primary-text"
              icon={<span className="material-icons">content_copy</span>}
              size="small"
            >
              {t('Copy as {{format}}', { format: 'Markdown' })}
            </Button>
            <Button
              onClick={() => {
                setIsDropOpen(false);
                void copyCurrentEditorToClipboard('html');
              }}
              color="primary-text"
              icon={<span className="material-icons">content_copy</span>}
              size="small"
            >
              {t('Copy as {{format}}', { format: 'HTML' })}
            </Button>
          </Box>
        </DropButton>
      </Box>
      {isModalShareOpen && (
        <ModalShare onClose={() => setIsModalShareOpen(false)} doc={doc} />
      )}
      {isModalPDFOpen && (
        <ModalPDF onClose={() => setIsModalPDFOpen(false)} doc={doc} />
      )}
      {isModalRemoveOpen && (
        <ModalRemoveDoc onClose={() => setIsModalRemoveOpen(false)} doc={doc} />
      )}
      {isModalVersionOpen && versionId && (
        <ModalVersion
          onClose={() => setIsModalVersionOpen(false)}
          docId={doc.id}
          versionId={versionId as string}
        />
      )}
    </Box>
  );
};
