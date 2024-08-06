import { Alert, Loader, VariantType } from '@openfun/cunningham-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useRouter } from 'next/router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Card, Text, TextErrors } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { DocHeader } from '@/features/docs/doc-header';
import { Doc } from '@/features/docs/doc-management';
import {
  Panel,
  Versions,
  useDocVersion,
} from '@/features/docs/doc-versioning/';

import { BlockNoteEditor } from './BlockNoteEditor';

interface DocEditorProps {
  doc: Doc;
}

export const DocEditor = ({ doc }: DocEditorProps) => {
  const {
    query: { versionId },
  } = useRouter();

  const { t } = useTranslation();

  const isVersion = versionId && typeof versionId === 'string';

  const { colorsTokens } = useCunninghamTheme();

  return (
    <>
      <DocHeader doc={doc} />
      {!doc.abilities.partial_update && (
        <Box $margin={{ all: 'small', top: 'none' }}>
          <Alert type={VariantType.WARNING}>
            {t(`Read only, you don't have the right to update this document.`)}
          </Alert>
        </Box>
      )}
      {isVersion && (
        <Box $margin={{ all: 'small', top: 'none' }}>
          <Alert type={VariantType.WARNING}>
            {t(`You cannot edit document version.`)}
          </Alert>
        </Box>
      )}
      <Box
        $background={colorsTokens()['primary-bg']}
        $height="100%"
        $direction="row"
        $margin={{ all: 'small', top: 'none' }}
        $gap="1rem"
      >
        <Card $padding="big" $css="flex:1;" $overflow="auto">
          {isVersion ? (
            <DocVersionEditor doc={doc} versionId={versionId} />
          ) : (
            <BlockNoteEditor doc={doc} />
          )}
        </Card>
        {doc.abilities.versions_list && <Panel doc={doc} />}
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

  const navigate = useNavigate();

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

  return <BlockNoteEditor doc={doc} version={version} />;
};
