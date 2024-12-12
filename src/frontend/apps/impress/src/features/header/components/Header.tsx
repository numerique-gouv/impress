import { Button } from '@openfun/cunningham-react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, StyledLink, Text } from '@/components/';
import { ButtonLogin } from '@/core/auth';
import { useCunninghamTheme } from '@/cunningham';
import { LanguagePicker } from '@/features/language';
import { useLeftPanelStore } from '@/features/left-panel';
import { useResponsiveStore } from '@/stores';

import { default as IconDocs } from '../assets/icon-docs.svg?url';
import { HEADER_HEIGHT } from '../conf';

import { LaGaufre } from './LaGaufre';

export const Header = () => {
  const { t } = useTranslation();
  const theme = useCunninghamTheme();
  const { isPanelOpen, togglePanel } = useLeftPanelStore();
  const { isDesktop } = useResponsiveStore();

  const spacings = theme.spacingsTokens();
  const colors = theme.colorsTokens();

  return (
    <Box
      as="header"
      $css={css`
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        height: ${HEADER_HEIGHT}px;
        min-height: ${HEADER_HEIGHT}px;
        padding: 0 ${spacings['base']};
        background-color: ${colors['greyscale-000']};
        border-bottom: 1px solid ${colors['greyscale-200']};
      `}
    >
      {!isDesktop && (
        <Button
          size="medium"
          onClick={togglePanel}
          aria-label={t('Open the header menu')}
          color="primary-text"
          icon={<Icon iconName={isPanelOpen ? 'close' : 'menu'} />}
        />
      )}

      <StyledLink href="/">
        <Box
          $align="center"
          $gap={spacings['3xs']}
          $direction="row"
          $position="relative"
          $height="fit-content"
          $margin={{ top: 'auto' }}
        >
          <Image priority src={IconDocs} alt={t('Docs Logo')} width={25} />

          <Box $direction="row" $align="center" $gap={spacings['2xs']}>
            <Text
              $margin="none"
              as="h2"
              $color="#000091"
              $zIndex={1}
              $size="1.30rem"
            >
              {t('Docs')}
            </Text>
            <Text
              $padding={{ horizontal: 'xs', vertical: '1px' }}
              $size="11px"
              $theme="primary"
              $variation="500"
              $weight="bold"
              $radius="12px"
              $background={colors['primary-200']}
            >
              BETA
            </Text>
          </Box>
        </Box>
      </StyledLink>
      {!isDesktop ? (
        <Box $direction="row" $gap={spacings['sm']}>
          <LaGaufre />
        </Box>
      ) : (
        <Box $align="center" $gap={spacings['sm']} $direction="row">
          <ButtonLogin />
          <LanguagePicker />
          <LaGaufre />
        </Box>
      )}
    </Box>
  );
};
