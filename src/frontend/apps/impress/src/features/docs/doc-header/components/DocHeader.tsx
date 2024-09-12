import { Button } from '@openfun/cunningham-react';
import React, { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Card, StyledLink, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import {
  Doc,
  Role,
  currentDocRole,
  useTransRole,
} from '@/features/docs/doc-management';
import { ModalVersion, Versions } from '@/features/docs/doc-versioning';
import { useDate } from '@/hook';

import { DocTagPublic } from './DocTagPublic';
import { DocToolBox } from './DocToolBox';

interface DocHeaderProps {
  doc: Doc;
  versionId?: Versions['version_id'];
}

export const DocHeader = ({ doc, versionId }: DocHeaderProps) => {
  const { colorsTokens } = useCunninghamTheme();
  const { t } = useTranslation();
  const { formatDate } = useDate();
  const transRole = useTransRole();
  const [isModalVersionOpen, setIsModalVersionOpen] = useState(false);

  return (
    <>
      <Card
        $margin="small"
        aria-label={t('It is the card information about the document.')}
      >
        <Box $padding="small" $direction="row" $align="center">
          <StyledLink href="/">
            <Text
              $isMaterialIcon
              $theme="primary"
              $variation="700"
              $size="2rem"
              $css={`&:hover {background-color: ${colorsTokens()['primary-100']}; };`}
              $hasTransition
              $radius="5px"
              $padding="tiny"
            >
              home
            </Text>
          </StyledLink>
          <Box
            $width="1px"
            $height="70%"
            $background={colorsTokens()['greyscale-100']}
            $margin={{ horizontal: 'small' }}
          />
          <Box $gap="1rem" $direction="row">
            <Text
              as="h2"
              $align="center"
              $margin={{ all: 'none', left: 'tiny' }}
            >
              {doc.title}
            </Text>
            {versionId && (
              <Button
                onClick={() => {
                  setIsModalVersionOpen(true);
                }}
                size="small"
              >
                {t('Restore this version')}
              </Button>
            )}
          </Box>
          <DocToolBox doc={doc} />
        </Box>
        <Box
          $direction="row"
          $align="center"
          $css="border-top:1px solid #eee"
          $padding={{ horizontal: 'big', vertical: 'tiny' }}
          $gap="0.5rem 2rem"
          $justify="space-between"
          $wrap="wrap"
        >
          <Box $direction="row" $align="center" $gap="0.5rem 2rem" $wrap="wrap">
            <DocTagPublic />
            <Text $size="s" $display="inline">
              {t('Created at')} <strong>{formatDate(doc.created_at)}</strong>
            </Text>
            <Text $size="s" $display="inline" $elipsis $maxWidth="60vw">
              {t('Owners:')}{' '}
              <strong>
                {doc.accesses
                  .filter(
                    (access) => access.role === Role.OWNER && access.user.email,
                  )
                  .map((access, index, accesses) => (
                    <Fragment key={`access-${index}`}>
                      {access.user.email}{' '}
                      {index < accesses.length - 1 ? ' / ' : ''}
                    </Fragment>
                  ))}
              </strong>
            </Text>
          </Box>
          <Text $size="s" $display="inline">
            {t('Your role:')}{' '}
            <strong>{transRole(currentDocRole(doc.abilities))}</strong>
          </Text>
        </Box>
      </Card>
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
