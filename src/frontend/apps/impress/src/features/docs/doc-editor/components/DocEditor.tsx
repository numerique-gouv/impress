import { Alert, Loader, VariantType } from '@openfun/cunningham-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Text, TextErrors } from '@/components';
import { DocHeader } from '@/features/docs/doc-header';
import { Doc } from '@/features/docs/doc-management';
import { TableContent } from '@/features/docs/doc-table-content';
import { Versions, useDocVersion } from '@/features/docs/doc-versioning/';
import { useResponsiveStore } from '@/stores';

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
  const [isTableContentOpen, setIsTableContentOpen] = useState(false);

  const { screenWidth, isMobile } = useResponsiveStore();
  const isOverlapping = screenWidth < 1420 && isTableContentOpen;

  return (
    <>
      <DocHeader doc={doc} versionId={versionId as Versions['version_id']} />
      {(!doc.abilities.partial_update || isVersion) && (
        <Box
          $margin={{ all: 'small', top: 'none', horizontal: 'auto' }}
          $padding={{ horizontal: 'small' }}
          $maxWidth="820px"
          $width="100%"
        >
          <Alert type={VariantType.WARNING}>
            {!doc.abilities.partial_update
              ? t(`Read only, you cannot edit this document.`)
              : t(`Read only, you cannot edit document versions.`)}
          </Alert>
        </Box>
      )}
      <Box
        $height="100%"
        $direction="row"
        $width="100%"
        $justify="center"
        $position="relative"
        $gap="1rem"
        $hasTransition
        $padding={{ right: isOverlapping && !isMobile ? '18rem' : 'none' }}
      >
        <Box $maxWidth="888px" $width="100%">
          {isVersion ? (
            <DocVersionEditor doc={doc} versionId={versionId} />
          ) : (
            <BlockNoteEditor doc={doc} />
          )}
        </Box>
        <TableContent doc={doc} setIsTableContentOpen={setIsTableContentOpen} />
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
