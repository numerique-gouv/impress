import Image from 'next/image';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Box, Text } from '@/components/';

import { LanguagePicker } from '../language/';

import { default as IconGouv } from './assets/icon-gouv.svg?url';
import { default as IconImpress } from './assets/icon-impress.svg?url';
import { default as IconMarianne } from './assets/icon-marianne.svg?url';
import IconMyAccount from './assets/icon-my-account.png';

export const HEADER_HEIGHT = '100px';

const RedStripe = styled.div`
  position: absolute;
  height: 5px;
  width: 100%;
  background: var(--c--theme--colors--danger-500);
  top: 0;
`;

const StyledHeader = styled.header`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: ${HEADER_HEIGHT};
  width: 100%;
  background: white;
  box-shadow: 0 1px 4px #00000040;
  z-index: 100;
`;

export const Header = () => {
  const { t } = useTranslation();

  return (
    <StyledHeader>
      <RedStripe />
      <Box
        $margin={{ horizontal: 'xbig' }}
        $align="center"
        $justify="space-between"
        $direction="row"
      >
        <Box>
          <Image priority src={IconMarianne} alt={t('Marianne Logo')} />
          <Box $align="center" $gap="6rem" $direction="row">
            <Image
              priority
              src={IconGouv}
              alt={t('Freedom Equality Fraternity Logo')}
            />
            <Box $align="center" $gap="1rem" $direction="row">
              <Image priority src={IconImpress} alt={t('Impress Logo')} />
              <Text $margin="none" as="h2" $theme="primary">
                {t('Impress')}
              </Text>
            </Box>
          </Box>
        </Box>
        <Box
          $align="center"
          $css={`
            & > button {
              padding: 0;
            }
          `}
          $gap="5rem"
          $justify="flex-end"
          $direction="row"
        >
          <Box $align="center" $direction="row">
            <LanguagePicker />
          </Box>
          <Box $direction="row" $align="center">
            <Box $direction="row" $align="center" $gap="1rem">
              <Text $weight="bold" $theme="primary">
                John Doe
              </Text>
              <Image
                width={58}
                height={58}
                priority
                src={IconMyAccount}
                alt={t(`Profile picture`)}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </StyledHeader>
  );
};
