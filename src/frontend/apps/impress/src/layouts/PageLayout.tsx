import { PropsWithChildren } from 'react';

import { Box } from '@/components';
import { Footer } from '@/features/footer';
import { Header } from '@/features/header';

export function PageLayout({ children }: PropsWithChildren) {
  return (
    <Box $minHeight="100vh">
      <Header />
      <Box as="main" $width="100%" $css="flex-grow:1;">
        {children}
      </Box>
      <Footer />
    </Box>
  );
}
