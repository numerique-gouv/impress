import { Alert, Loader, VariantType } from '@openfun/cunningham-react';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Y from 'yjs';

import { Box, Card, Text, TextErrors } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { DocHeader } from '@/features/docs/doc-header';
import {
  Doc,
  base64ToBlocknoteXmlFragment,
  useDocStore,
} from '@/features/docs/doc-management';
import { Versions, useDocVersion } from '@/features/docs/doc-versioning/';
import { useResponsiveStore } from '@/stores';

import { BlockNoteEditor, BlockNoteEditorVersion } from './BlockNoteEditor';
import { IconOpenPanelEditor, PanelEditor } from './PanelEditor';

interface DocEditorProps {
  doc: Doc;
}

export const DocEditor = ({ doc }: DocEditorProps) => {
  const {
    query: { versionId },
  } = useRouter();
  const { t } = useTranslation();
  const { isMobile } = useResponsiveStore();

  const isVersion = versionId && typeof versionId === 'string';

  const { colorsTokens } = useCunninghamTheme();

  const { providers } = useDocStore();
  const provider = providers?.[doc.id];

  if (!provider) {
    return null;
  }

  return (
    <>
      <DocHeader doc={doc} />
      {!doc.abilities.partial_update && (
        <Box $width="100%" $margin={{ all: 'small', top: 'none' }}>
          <Alert type={VariantType.WARNING}>
            {t(`Read only, you cannot edit this document.`)}
          </Alert>
        </Box>
      )}
      {isVersion && (
        <Box $margin={{ all: 'small', top: 'none' }}>
          <Alert type={VariantType.WARNING}>
            {t(`Read only, you cannot edit document versions.`)}
          </Alert>
        </Box>
      )}
      <Box
        $background={colorsTokens()['primary-bg']}
        $direction="row"
        $width="100%"
        $margin={{ all: isMobile ? 'tiny' : 'small', top: 'none' }}
        $css="overflow-x: clip; flex: 1;"
        $position="relative"
      >
        <Card
          $padding={isMobile ? 'small' : 'big'}
          $css="flex:1;"
          $overflow="auto"
          $position="relative"
        >
          {isVersion ? (
            <DocVersionEditor docId={doc.id} versionId={versionId} />
          ) : (
            <BlockNoteEditor doc={doc} provider={provider} />
          )}
          {!isMobile && <IconOpenPanelEditor />}
        </Card>
        <PanelEditor doc={doc} />
      </Box>
    </>
  );
};

interface DocVersionEditorProps {
  docId: Doc['id'];
  versionId: Versions['version_id'];
}

export const DocVersionEditor = ({
  docId,
  versionId,
}: DocVersionEditorProps) => {
  const {
    data: version,
    isLoading,
    isError,
    error,
  } = useDocVersion({
    docId,
    versionId,
  });

  const { replace } = useRouter();
  const [initialContent, setInitialContent] = useState<Y.XmlFragment>();

  useEffect(() => {
    if (!version?.content) {
      return;
    }

    setInitialContent(base64ToBlocknoteXmlFragment(version.content));
  }, [version?.content]);

  if (isError && error) {
    if (error.status === 404) {
      void replace(`/404`);
      return null;
    }

    return (
      <Box $margin="large">
        <TextErrors
          causes={error.cause}
          icon={
            error.status === 502 ? (
              <Text className="material-icons" $theme="danger">
                wifi_off
              </Text>
            ) : undefined
          }
        />
      </Box>
    );
  }

  if (isLoading || !version || !initialContent) {
    return (
      <Box $align="center" $justify="center" $height="100%">
        <Loader />
      </Box>
    );
  }

  return <BlockNoteEditorVersion initialContent={initialContent} />;
};
