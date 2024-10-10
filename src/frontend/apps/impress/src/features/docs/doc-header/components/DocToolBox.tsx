import { Button, VariantType, useToastProvider } from '@openfun/cunningham-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, DropButton, IconOptions, Text } from '@/components';
import { useAuthStore } from '@/core';
import { usePanelEditorStore, useDocStore } from '@/features/docs/doc-editor/';
import {
  Doc,
  ModalRemoveDoc,
  ModalShare,
} from '@/features/docs/doc-management';
import { useResponsiveStore } from '@/stores';

import { ModalVersion, Versions } from '../../doc-versioning';

import { ModalPDF } from './ModalExport';

interface DocToolBoxProps {
  doc: Doc;
  versionId?: Versions['version_id'];
}

export const DocToolBox = ({ doc, versionId }: DocToolBoxProps) => {
  const { t } = useTranslation();
  const [isModalShareOpen, setIsModalShareOpen] = useState(false);
  const [isModalRemoveOpen, setIsModalRemoveOpen] = useState(false);
  const [isModalPDFOpen, setIsModalPDFOpen] = useState(false);
  const [isDropOpen, setIsDropOpen] = useState(false);
  const { setIsPanelOpen, setIsPanelTableContentOpen } = usePanelEditorStore();
  const [isModalVersionOpen, setIsModalVersionOpen] = useState(false);
  const { isSmallMobile } = useResponsiveStore();
  const { authenticated } = useAuthStore();
  const { docsStore } = useDocStore();
  const { toast } = useToastProvider();

  const getDocContentFormatted = (format: 'html'|'markdown'): Promise<string> => {
    const editor = docsStore[doc.id]?.editor;
    if (!editor) {
      return Promise.reject(new Error('Editor not available'));
    }
  
    switch (format) {
      case 'html':
        return editor.blocksToHTMLLossy();
      case 'markdown':
        return editor.blocksToMarkdownLossy();
      default:
        return Promise.reject(new Error(`Unsupported format: ${format}`));
    }
  }

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
                <Text $theme="primary">{t('Version history')}</Text>
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
              <Text $theme="primary">{t('Table of contents')}</Text>
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
              <Text $theme="primary">{t('Export')}</Text>
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
                <Text $theme="primary">{t('Delete document')}</Text>
              </Button>
            )}
            <Button
              onClick={() => {
                setIsDropOpen(false);
                getDocContentFormatted('markdown')
                  .then((docContentFormatted) => {
                    navigator.clipboard.writeText(docContentFormatted); 
                    toast(t('Copied to clipboard'), VariantType.SUCCESS, { duration: 3000 })}
                  )
                  .catch(() => toast(t('Failed to copy to clipboard'), VariantType.ERROR, { duration: 3000 }))
              }}
              color="primary-text"
              icon={<span className="material-icons">content_copy</span>}
              size="small"
            >
              <Text $theme="primary">{t('Copy as {{target}}', {target: "Markdown"})}</Text>
            </Button>
            <Button
              onClick={() => {
                setIsDropOpen(false);
                getDocContentFormatted('html')
                  .then((docContentFormatted) => {
                    navigator.clipboard.writeText(docContentFormatted); 
                    toast(t('Copied to clipboard'), VariantType.SUCCESS, { duration: 3000 })}
                  )
                  .catch(() => toast(t('Failed to copy to clipboard'), VariantType.ERROR, { duration: 3000 }))
              }}
              color="primary-text"
              icon={<span className="material-icons">content_copy</span>}
              size="small"
            >
              <Text $theme="primary">{t('Copy as {{target}}', {target: "HTML"})}</Text>
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
          versionId={versionId}
        />
      )}
    </Box>
  );
};
