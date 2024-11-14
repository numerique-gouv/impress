import { PropsWithChildren, ReactNode } from 'react';

import { Box } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { Header } from '@/features/header';
import { HEADER_HEIGHT } from '@/features/header/conf';
import { LeftPanel } from '@/features/left-pannel/components/LeftPanel';
import { useResponsiveStore } from '@/stores';

export enum MainLayoutBackgroundColor {
  WHITE = 'white',
  GREY = 'grey',
}

type MainLayoutProps = {
  backgroundColor?: MainLayoutBackgroundColor;
  leftPanelContent?: ReactNode;
};

export function MainLayout({
  children,
  backgroundColor = MainLayoutBackgroundColor.WHITE,
  leftPanelContent,
}: PropsWithChildren<MainLayoutProps>) {
  const { isResponsive } = useResponsiveStore();
  const { themeTokens, colorsTokens } = useCunninghamTheme();
  const tokens = themeTokens();
  const colors = colorsTokens();

  return (
    <div>
      <Header />
      <Box $direction="row" $width="100%">
        <LeftPanel>{leftPanelContent}</LeftPanel>
        <Box
          as="main"
          id="mainContent"
          $padding={{
            vertical: !isResponsive
              ? ((tokens.spacings?.['200W'] as string) ?? '1.12rem')
              : ((tokens.spacings?.['100V'] as string) ?? '0.5rem'),
            horizontal: !isResponsive
              ? ((tokens.spacings?.['1200W'] as string) ?? '5.62rem')
              : ((tokens.spacings?.['100V'] as string) ?? '0.5rem'),
          }}
          $css={`
              display: flex;
              width: 100%;
              flex-direction: column;
              align-items: center;
              flex: 1;
              height: calc(100dvh - ${HEADER_HEIGHT}px);
              overflow-y: scroll;
              background-color: ${backgroundColor === MainLayoutBackgroundColor.WHITE ? colors['greyscale-000'] : colors['greyscale-050']};
            `}
        >
          {children}
        </Box>
      </Box>
    </div>
  );
}
