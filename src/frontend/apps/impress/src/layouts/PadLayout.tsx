import { PropsWithChildren } from 'react';

import { Box } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { Panel } from '@/features/pads/pads-panel';

import { MainLayout } from './MainLayout';

export function PadLayout({ children }: PropsWithChildren) {
  const { colorsTokens } = useCunninghamTheme();

  return (
    <MainLayout>
      <Box $height="inherit" $direction="row">
        <Panel />
        <Box
          $background={colorsTokens()['primary-bg']}
          $width="100%"
          $height="inherit"
        >
          {children}
        </Box>
      </Box>
    </MainLayout>
  );
}
