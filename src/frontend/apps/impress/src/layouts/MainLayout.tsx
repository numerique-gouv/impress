import { PropsWithChildren } from 'react';

import { Box } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { Header } from '@/features/header';
import { HEADER_HEIGHT } from '@/features/header/conf';
import { LeftPanel } from '@/features/left-pannel/components/LeftPanel';

export enum MainLayoutBackgroundColor {
  WHITE = 'white',
  GREY = 'grey',
}

type MainLayoutProps = {
  backgroundColor?: MainLayoutBackgroundColor;
};

export function MainLayout({
  children,
  backgroundColor = MainLayoutBackgroundColor.WHITE,
}: PropsWithChildren<MainLayoutProps>) {
  const { themeTokens, colorsTokens } = useCunninghamTheme();
  const tokens = themeTokens();
  const colors = colorsTokens();

  return (
    <div>
      <Header />
      <Box $direction="row" $width="100%">
        <LeftPanel />
        <Box
          as="main"
          id="mainContent"
          $css={`
              display: flex;
              width: 100%;
              flex-direction: column;
              align-items: center;
              flex: 1;
              padding: ${tokens.spacings?.['200W'] ?? '1.12rem'} ${tokens.spacings?.['1200W'] ?? '5.62rem'};
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
