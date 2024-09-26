import Image from 'next/image';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box, StyledLink, Text } from '@/components/';
import { ButtonLogin } from '@/core/auth';
import { LanguagePicker } from '@/features/language';
import { useResponsiveStore } from '@/stores';

import { default as IconDocs } from '../assets/icon-docs.svg?url';

import { DropdownMenu } from './DropdownMenu';
import { LaGaufre } from './LaGaufre';

export const Header = () => {
  const { t } = useTranslation();
  const { screenSize } = useResponsiveStore();

  return (
    <Box
      as="header"
      $justify="center"
      $width="100%"
      $zIndex="100"
      $padding={{ vertical: 'xtiny' }}
      $css="box-shadow: 0 1px 4px #00000040;"
    >
      <Box
        $margin={{
          left: 'big',
          right: screenSize === 'small-mobile' ? 'none' : 'big',
        }}
        $align="center"
        $justify="space-between"
        $direction="row"
      >
        <Box $gap="6rem" $direction="row">
          <StyledLink href="/">
            <Box
              $align="center"
              $gap="0.8rem"
              $direction="row"
              $position="relative"
              $height="fit-content"
              $margin={{ top: 'auto' }}
            >
              <Image priority src={IconDocs} alt={t('Docs Logo')} width={25} />
              <Text
                $padding="2px 3px"
                $size="8px"
                $background="#368bd6"
                $color="white"
                $position="absolute"
                $radius="5px"
                $css={`
                  bottom: 13px;
                  right: -17px;
                `}
              >
                BETA
              </Text>
              <Text
                $margin="none"
                as="h2"
                $theme="primary"
                $zIndex={1}
                $size="1.30rem"
              >
                {t('Docs')}
              </Text>
            </Box>
          </StyledLink>
        </Box>
        {screenSize === 'small-mobile' ? (
          <Box $direction="row" $gap="2rem">
            <LaGaufre />
            <DropdownMenu />
          </Box>
        ) : (
          <Box $align="center" $gap="1.5rem" $direction="row">
            <ButtonLogin />
            <LanguagePicker />
            <LaGaufre />
          </Box>
        )}
      </Box>
    </Box>
  );
};
