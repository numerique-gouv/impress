import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Card, StyledLink, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import {
  Doc,
  Role,
  currentDocRole,
  useTransRole,
} from '@/features/docs/doc-management';
import { useDate } from '@/hook';

import { DocToolBox } from './DocToolBox';

interface DocHeaderProps {
  doc: Doc;
}

export const DocHeader = ({ doc }: DocHeaderProps) => {
  const { colorsTokens } = useCunninghamTheme();
  const { t } = useTranslation();
  const { formatDate } = useDate();
  const transRole = useTransRole();

  return (
    <Card
      $margin="big"
      aria-label={t('It is the card information about the document.')}
    >
      <Box $padding="small" $direction="row" $align="center">
        <StyledLink href="/">
          <Text
            className="material-icons"
            $theme="primary"
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
        <Text as="h2" $align="center" $margin={{ all: 'none', left: 'tiny' }}>
          {doc.title}
        </Text>
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
          {doc.is_public && (
            <Text
              $weight="bold"
              $background={colorsTokens()['primary-600']}
              $color="white"
              $padding="xtiny"
              $radius="3px"
              $size="s"
            >
              {t('Public')}
            </Text>
          )}
          <Text $size="s" $display="inline">
            {t('Created at')} <strong>{formatDate(doc.created_at)}</strong>
          </Text>
          <Text $size="s" $display="inline" $elipsis $maxWidth="60vw">
            {t('Owners:')}{' '}
            <strong>
              {doc.accesses
                .filter((access) => access.role === Role.OWNER)
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
  );
};
