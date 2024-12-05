import { createGlobalStyle, css } from 'styled-components';

import { Box, SeparatedSection } from '@/components';
import { ButtonLogin } from '@/core';
import { useCunninghamTheme } from '@/cunningham';
import { HEADER_HEIGHT } from '@/features/header/conf';
import { LanguagePicker } from '@/features/language';
import { useResponsiveStore } from '@/stores';

import { useLeftPanelStore } from '../stores';

import { LeftPanelContent } from './LeftPanelContent';
import { LeftPanelHeader } from './LeftPanelHeader';

const MobileLeftPanelStyle = createGlobalStyle`
  body {
    overflow: hidden;
  }
`;

export const LeftPanel = () => {
  const { isDesktop } = useResponsiveStore();
  const { isPanelOpen } = useLeftPanelStore();
  const theme = useCunninghamTheme();
  const colors = theme.colorsTokens();
  const spacings = theme.spacingsTokens();

  return (
    <>
      {isDesktop && (
        <Box
          data-testid="left-panel-desktop"
          $css={`
            height: calc(100vh - ${HEADER_HEIGHT}px);
            width: 300px;
            min-width: 300px;
            border-right: 1px solid ${colors['greyscale-200']};
        `}
        >
          <LeftPanelHeader />
          <LeftPanelContent />
        </Box>
      )}

      {!isDesktop && (
        <>
          {isPanelOpen && <MobileLeftPanelStyle />}
          <Box
            $hasTransition
            $css={css`
              z-index: 999;
              width: 100dvw;
              height: calc(100dvh - 52px);
              border-right: 1px solid var(--c--theme--colors--greyscale-200);
              position: fixed;
              transform: translateX(${isPanelOpen ? '0' : '-100dvw'});
              background-color: var(--c--theme--colors--greyscale-000);
            `}
          >
            <Box
              data-testid="left-panel-mobile"
              $css={css`
                width: 100%;
                justify-content: center;
                align-items: center;
                gap: ${spacings['base']};
              `}
            >
              <LeftPanelHeader />
              <LeftPanelContent />
              <SeparatedSection showSeparator={false}>
                <Box $justify="center" $align="center" $gap={spacings['sm']}>
                  <ButtonLogin />
                  <LanguagePicker />
                </Box>
              </SeparatedSection>
            </Box>
          </Box>
        </>
      )}
    </>
  );
};
