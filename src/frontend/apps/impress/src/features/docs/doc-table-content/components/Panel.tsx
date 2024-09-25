import React, { PropsWithChildren, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Card, IconBG, Text } from '@/components';
import { useResponsiveStore } from '@/stores';

interface PanelProps {
  title?: string;
  setIsPanelOpen: (isOpen: boolean) => void;
}

export const Panel = ({
  children,
  title,
  setIsPanelOpen,
}: PropsWithChildren<PanelProps>) => {
  const { isMobile } = useResponsiveStore();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(true);
  }, []);

  return (
    <Card
      $maxWidth="18rem"
      $minWidth="10rem"
      $position="absolute"
      $height="100%"
      $css={`
        right: 0;
        transition: all 0.5s ease-in-out;
        transform: translateX(0%);
        border: none;
        ${
          !isOpen
            ? `
              transform: translateX(100%);
              opacity: 0;
            `
            : ''
        }
        ${!isMobile ? `box-shadow: none;` : 'box-shadow: -1px 8px 8px #e1e1e1;'}
      `}
      aria-label={t('Document panel')}
    >
      <Box
        $overflow="inherit"
        $position="sticky"
        $maxHeight="80vh"
        $css="top: 5px;"
      >
        <Box
          $padding={{ vertical: 'small' }}
          $direction="row"
          $align="center"
          $justify="center"
        >
          <IconBG
            iconName="menu_open"
            aria-label={isOpen ? t('Close the panel') : t('Open the panel')}
            $background="transparent"
            $size="h2"
            $zIndex={1}
            $css={`
              cursor: pointer;
              right: 0rem;
              transform: rotate(180deg);
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
          {title && (
            <Text $weight="bold" $size="l" $theme="primary">
              {title}
            </Text>
          )}
        </Box>
        {children}
      </Box>
    </Card>
  );
};
