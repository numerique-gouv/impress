import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, BoxButton, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';

import { PadList } from './PadList';
import { PanelActions } from './PanelActions';

export const Panel = () => {
  const { t } = useTranslation();
  const { colorsTokens } = useCunninghamTheme();

  const [isOpen, setIsOpen] = useState(true);

  const closedOverridingStyles = !isOpen && {
    $width: '0',
    $maxWidth: '0',
    $minWidth: '0',
  };

  const transition = 'all 0.5s ease-in-out';

  return (
    <Box
      $width="100%"
      $maxWidth="20rem"
      $minWidth="14rem"
      $css={`
        position: relative;
        border-right: 1px solid ${colorsTokens()['primary-300']};
        transition: ${transition};
      `}
      $height="inherit"
      aria-label="Documents panel"
      {...closedOverridingStyles}
    >
      <BoxButton
        className="material-icons"
        aria-label={
          isOpen
            ? t('Close the documents panel')
            : t('Open the documents panel')
        }
        $background="white"
        $color={colorsTokens()['primary-600']}
        $radius="100%"
        $padding="0.3rem"
        $position="absolute"
        onClick={() => setIsOpen(!isOpen)}
        $css={`
          right: ${isOpen ? '-1.3' : '-2.8'}rem;
          top: ${isOpen ? '0.7' : '0.25'}rem;
          transform: rotate(${isOpen ? '0' : '180'}deg);
          transition: ${transition};
          font-size: 1.8rem;
          border: 1px solid #fafafa;
          box-shadow: ${isOpen ? '1px 1px' : '-1px -1px'} 3px #dfdfdf;
          z-index: 1;
        `}
      >
        menu_open
      </BoxButton>
      <Box
        $css={`
          overflow: hidden;
          opacity: ${isOpen ? '1' : '0'};
          transition: ${transition};
        `}
      >
        <Box
          $padding={{ all: 'small', right: 'large' }}
          $direction="row"
          $align="center"
          $justify="space-between"
          $css={`border-bottom: 1px solid ${colorsTokens()['primary-300']};`}
        >
          <Text $weight="bold" $size="1.25rem">
            {t('Documents')}
          </Text>
          <PanelActions />
        </Box>
        <PadList />
      </Box>
    </Box>
  );
};
