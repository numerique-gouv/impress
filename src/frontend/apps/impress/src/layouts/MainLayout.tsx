import { PropsWithChildren } from 'react';

import { Box } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { Footer } from '@/features/footer';
import { Header } from '@/features/header';

interface MainLayoutProps {
  withoutFooter?: boolean;
}

export function MainLayout({
  children,
  withoutFooter,
}: PropsWithChildren<MainLayoutProps>) {
  const { colorsTokens } = useCunninghamTheme();

  return (
    <Box>
      <Box $minHeight="100vh">
        <Header />
        <Box $css="flex: 1;" $direction="row">
          <Box
            as="main"
            $minHeight="100vh"
            $width="100%"
            $background={colorsTokens()['primary-bg']}
          >
            {children}
          </Box>
        </Box>
      </Box>
      {!withoutFooter && <Footer />}
    </Box>
  );
}
