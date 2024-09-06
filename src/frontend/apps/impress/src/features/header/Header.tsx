import Image from 'next/image';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Box, StyledLink, Text } from '@/components/';
import { AccountDropdown } from '@/core/auth';
import { useCunninghamTheme } from '@/cunningham';

import { LanguagePicker } from '../language/';

import { LaGaufre } from './LaGaufre';
import { default as IconDocs } from './assets/icon-docs.svg?url';

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
  const { themeTokens } = useCunninghamTheme();
  const logo = themeTokens().logo;

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
          {logo && (
            <Image
              priority
              src={logo.src}
              alt={logo.alt}
              width={0}
              height={0}
              style={{ width: logo.widthHeader, height: 'auto' }}
            />
          )}
          <StyledLink href="/">
            <Box
              $align="center"
              $gap="0.8rem"
              $direction="row"
              $position="relative"
              $height="fit-content"
              $margin={{ top: 'auto' }}
            >
              <Image priority src={IconDocs} alt={t('Docs Logo')} width={38} />
              <Text
                $padding="3px 5px"
                $size="8px"
                $background="#368bd6"
                $color="white"
                $position="absolute"
                $radius="5px"
                $css={`
                  bottom: 21px;
                  right: -21px;
                `}
              >
                BETA
              </Text>
              <Text $margin="none" as="h2" $theme="primary" $zIndex={1}>
                {t('Docs')}
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
