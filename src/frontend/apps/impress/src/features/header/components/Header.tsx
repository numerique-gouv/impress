import { Button } from '@openfun/cunningham-react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import { Box, Icon, StyledLink, Text } from '@/components/';
import { ButtonLogin } from '@/core/auth';
import { useCunninghamTheme } from '@/cunningham';
import { LanguagePicker } from '@/features/language';
import { useResponsiveStore } from '@/stores';

import { default as IconDocs } from '../assets/icon-docs.svg?url';
import { HEADER_HEIGHT } from '../conf';

import { LaGaufre } from './LaGaufre';

export const Header = () => {
  const { t } = useTranslation();
  const theme = useCunninghamTheme();
  const tokens = theme.themeTokens();
  const colors = theme.colorsTokens();
  const { isResponsive, toggleMobileMenu } = useResponsiveStore();

  return (
    <Box
      as="header"
      $css={`
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        height: ${HEADER_HEIGHT}px;
        min-height: ${HEADER_HEIGHT}px;
        padding: 0 ${tokens.spacings?.['300V'] ?? '1rem'};
        background-color: ${colors?.['greyscale-000'] ?? '#FFFFFF'};
        border-bottom: 1px solid ${(colors?.['greyscale-200'] as string) ?? '#E5E5E5'};
      `}
    >
      {isResponsive && (
        <Button
          size="medium"
          onClick={toggleMobileMenu}
          aria-label={t('Open the header menu')}
          color="primary-text"
          icon={<Icon iconName="menu" />}
        />
      )}

      <StyledLink href="/">
        <Box
          $align="center"
          $gap={(tokens.spacings?.['100V'] as string) ?? '0.8rem'}
          $direction="row"
          $position="relative"
          $height="fit-content"
          $margin={{ top: 'auto' }}
        >
          <Image priority src={IconDocs} alt={t('Docs Logo')} width={25} />

          <Text
            $margin="none"
            as="h2"
            $color="#000091"
            $zIndex={1}
            $size="1.30rem"
            $css="font-family: 'Marianne'"
          >
            {t('Docs')}
          </Text>
        </Box>
      </StyledLink>
      {isResponsive ? (
        <Box
          $direction="row"
          $gap={(tokens.spacings?.['300V'] as string) ?? '0.625rem'}
        >
          <LaGaufre />
        </Box>
      ) : (
        <Box
          $align="center"
          $gap={(tokens.spacings?.['300V'] as string) ?? '0.625rem'}
          $direction="row"
        >
          <ButtonLogin />
          <LanguagePicker />
          <LaGaufre />
        </Box>
      )}
    </Box>
  );
};
