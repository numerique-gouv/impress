import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Card, IconBG, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { Doc } from '@/features/docs/doc-management';

import { useDocVersionStore } from '../stores';

import { VersionList } from './VersionList';

interface PanelProps {
  doc: Doc;
}

export const Panel = ({ doc }: PanelProps) => {
  const { t } = useTranslation();
  const { colorsTokens } = useCunninghamTheme();
  const { setIsPanelOpen } = useDocVersionStore();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(true);
  }, []);

  const closedOverridingStyles = !isOpen && {
    $width: '0',
    $maxWidth: '0',
    $minWidth: '0',
  };

  const transition = 'all 0.5s ease-in-out';

  return (
    <Card
      $width="100%"
      $maxWidth="20rem"
      $position="sticky"
      $maxHeight="96vh"
      $height="100%"
      $css={`
        top: 2vh;
        transition: ${transition};
        ${
          !isOpen &&
          `
            box-shadow: none;
            border: none;
          `
        }
      `}
      aria-label={t('Document version panel')}
      {...closedOverridingStyles}
    >
      <Box
        $overflow="hidden"
        $css={`
          opacity: ${isOpen ? '1' : '0'};
          transition: ${transition};
        `}
      >
        <Box
          $padding={{ all: 'small' }}
          $direction="row"
          $align="center"
          $justify="center"
          $css={`border-top: 2px solid ${colorsTokens()['primary-600']};`}
        >
          <IconBG
            iconName="menu_open"
            aria-label={
              isOpen
                ? t('Close the document version panel')
                : t('Open the document version panel')
            }
            $background="transparent"
            $size="h2"
            $zIndex={1}
            $css={`
              cursor: pointer;
              left: 0rem;
              top: 0.1rem;
              transition: ${transition};
              transform: rotate(180deg);
              opacity: ${isOpen ? '1' : '0'};
              user-select: none;
            `}
            $position="absolute"
            onClick={() => {
              setIsOpen(false);
              setTimeout(() => {
                setIsPanelOpen(false);
              }, 400);
            }}
            $radius="2px"
          />
          <Text $weight="bold" $size="l" $theme="primary">
            {t('VERSIONS')}
          </Text>
        </Box>
        <VersionList doc={doc} />
      </Box>
    </Card>
  );
};
