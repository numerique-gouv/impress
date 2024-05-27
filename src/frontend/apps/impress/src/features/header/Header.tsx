import Image from 'next/image';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Box, StyledLink, Text } from '@/components/';
import LogoGouv from '@/components/LogoGouv';

import { LanguagePicker } from '../language/';

import { AccountDropdown } from './AccountDropdown';
import { LaGaufre } from './LaGaufre';
import { default as IconImpress } from './assets/icon-impress.svg?url';

export const HEADER_HEIGHT = '100px';

const RedStripe = styled.div`
  position: absolute;
  height: 5px;
  width: 100%;
  background: var(--c--theme--colors--danger-500);
  top: 0;
`;

export const Header = () => {
  const { t } = useTranslation();

  return (
    <Box
      as="header"
      $justify="center"
      $width="100%"
      $height={HEADER_HEIGHT}
      $zIndex="100"
      $css="box-shadow: 0 1px 4px #00000040;"
    >
      <RedStripe />
      <Box
        $margin={{ horizontal: 'xbig' }}
        $align="center"
        $justify="space-between"
        $direction="row"
      >
        <Box $gap="6rem" $direction="row">
          <LogoGouv
            textProps={{
              $size: 't',
              $css: 'line-height:10px',
              $margin: { vertical: '3px' },
            }}
          />
          <StyledLink href="/">
            <Box $align="center" $gap="1rem" $direction="row">
              <Image priority src={IconImpress} alt={t('Impress Logo')} />
              <Text $margin="none" as="h2" $theme="primary">
                {t('Impress')}
              </Text>
            </Box>
          </StyledLink>
        </Box>
        <Box $align="center" $gap="1.5rem" $direction="row">
          <AccountDropdown />
          <LanguagePicker />
          <LaGaufre />
        </Box>
      </Box>
    </Box>
  );
};
