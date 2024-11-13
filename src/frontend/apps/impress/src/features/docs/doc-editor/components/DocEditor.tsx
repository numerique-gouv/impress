import { Alert, Loader, VariantType } from '@openfun/cunningham-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Card, Text, TextErrors } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { DocHeader } from '@/features/docs/doc-header';
import { Doc, useDocStore } from '@/features/docs/doc-management';
import { Versions, useDocVersion } from '@/features/docs/doc-versioning/';
import { useResponsiveStore } from '@/stores';

import { useHeadingStore } from '../stores';

import { BlockNoteEditor } from './BlockNoteEditor';
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

  const { colorsTokens } = useCunninghamTheme();

  const { docsStore } = useDocStore();
  const provider = docsStore?.[doc.id]?.provider;

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
  const { createProvider, docsStore } = useDocStore();

  const navigate = useNavigate();

  useEffect(() => {
    if (!version?.id) {
      return;
    }

    const provider = docsStore?.[version.id]?.provider;
    if (!provider || provider.document.guid !== version.id) {
      createProvider(version.id, version.content);
    }
  }, [createProvider, docsStore, version]);

  if (isError && error) {
    if (error.status === 404) {
      navigate.replace(`/404`);
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

  const provider = docsStore?.[version.id]?.provider;

  if (!provider) {
    return null;
  }

  return <BlockNoteEditor doc={doc} storeId={version.id} provider={provider} />;
};
