import { Alert, Loader, VariantType } from '@openfun/cunningham-react';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Card, Text, TextErrors } from '@/components';
import { useCollaborationUrl } from '@/core';
import { useCunninghamTheme } from '@/cunningham';
import { DocHeader } from '@/features/docs/doc-header';
import { Doc, useDocStore } from '@/features/docs/doc-management';
import { Versions, useDocVersion } from '@/features/docs/doc-versioning/';
import { useResponsiveStore } from '@/stores';

import { useHeadingStore } from '../stores';

import { BlockNoteEditor } from './BlockNoteEditor';
import { IronCalcEditor } from './IronCalcEditor';
import { IconOpenPanelEditor, PanelEditor } from './PanelEditor';

interface DocEditorProps {
  doc: Doc;
}

export const DocEditor = ({ doc }: DocEditorProps) => {
  const {
    query: { versionId },
  } = useRouter();
  const { t } = useTranslation();
  const { headings } = useHeadingStore();
  const { isMobile } = useResponsiveStore();

  const isVersion = versionId && typeof versionId === 'string';

  const isSpreadsheet = true; //doc.content_type === 'spreadsheet';

  const { colorsTokens } = useCunninghamTheme();

  const { providers } = useDocStore();
  const provider = providers?.[doc.id];

  if (!provider) {
    return null;
  }

  return (
    <>
      <DocHeader doc={doc} versionId={versionId as Versions['version_id']} />
      {!doc.abilities.partial_update && (
        <Box $margin={{ all: 'small', top: 'none' }}>
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
        $height="100%"
        $direction="row"
        $margin={{ all: isMobile ? 'tiny' : 'small', top: 'none' }}
        $css="overflow-x: clip;"
        $position="relative"
      >
        <Card
          $padding={isSpreadsheet ? 'none' : isMobile ? 'small' : 'big'}
          $css="flex:1;"
          $overflow="auto"
          $position="relative"
        >
          {isSpreadsheet ? (
            <IronCalcEditor doc={doc} storeId={doc.id} provider={provider} />
          ) : isVersion ? (
            <DocVersionEditor doc={doc} versionId={versionId} />
          ) : (
            <BlockNoteEditor doc={doc} storeId={doc.id} provider={provider} />
          )}
          {!isMobile && <IconOpenPanelEditor headings={headings} />}
        </Card>
        <PanelEditor doc={doc} headings={headings} />
      </Box>
    </>
  );
};

interface DocVersionEditorProps {
  doc: Doc;
  versionId: Versions['version_id'];
}

export const DocVersionEditor = ({ doc, versionId }: DocVersionEditorProps) => {
  const {
    data: version,
    isLoading,
    isError,
    error,
  } = useDocVersion({
    docId: doc.id,
    versionId,
  });
  const { createProvider, providers } = useDocStore();
  const collaborationUrl = useCollaborationUrl(versionId);

  const { replace } = useRouter();

  useEffect(() => {
    if (!version?.id || !collaborationUrl) {
      return;
    }

    const provider = providers?.[version.id];
    if (!provider || provider.document.guid !== version.id) {
      createProvider(collaborationUrl, version.id, version.content);
    }
  }, [createProvider, providers, version, collaborationUrl]);

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

  if (isLoading || !version) {
    return (
      <Box $align="center" $justify="center" $height="100%">
        <Loader />
      </Box>
    );
  }

  const provider = providers?.[version.id];

  if (!provider) {
    return null;
  }

  return <BlockNoteEditor doc={doc} storeId={version.id} provider={provider} />;
};
