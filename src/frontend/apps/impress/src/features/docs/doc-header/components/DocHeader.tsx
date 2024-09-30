import { Button } from '@openfun/cunningham-react';
import React, { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, StyledLink, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { Doc } from '@/features/docs/doc-management';
import { ModalVersion, Versions } from '@/features/docs/doc-versioning';

import { DocToolBox } from './DocToolBox';

interface DocHeaderProps {
  doc: Doc;
  versionId?: Versions['version_id'];
}

export const DocHeader = ({ doc, versionId }: DocHeaderProps) => {
  const { colorsTokens } = useCunninghamTheme();
  const { t } = useTranslation();
  const [isModalVersionOpen, setIsModalVersionOpen] = useState(false);

  return (
    <>
      <Box
        as="header"
        $margin={{ vertical: 'big', horizontal: 'auto' }}
        $padding={{ vertical: 'none', horizontal: 'small' }}
        aria-label={t('It is the document header.')}
        $maxWidth="820px"
        $width="100%"
        $direction="row"
        $align="center"
        $wrap="wrap"
        $gap="1rem"
      >
        <Box
          $direction="row"
          $css="flex-shrink:0"
          $maxWidth="100%"
          $align="center"
        >
          <StyledLink href="/">
            <Text
              $theme="primary"
              $variation="400"
              $hasTransition
              $css={`&:hover{color:${colorsTokens()['primary-600']}}`}
            >
              {t('Home')}
            </Text>
          </StyledLink>
          <Text
            $theme="primary"
            $variation="400"
            $padding={{ horizontal: 'small' }}
          >
            /
          </Text>
          <Text $theme="primary">{doc.title}</Text>
        </Box>
        {versionId && (
          <Box $gap="1rem" $direction="row">
            <Button
              onClick={() => {
                setIsModalVersionOpen(true);
              }}
              size="small"
            >
              {t('Restore this version')}
            </Button>
          </Box>
        )}
        <DocToolBox doc={doc} />
      </Box>
      {isModalVersionOpen && versionId && (
        <ModalVersion
          onClose={() => setIsModalVersionOpen(false)}
          docId={doc.id}
          versionId={versionId}
        />
      )}
    </>
  );
};
