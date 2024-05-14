import { PropsWithChildren } from 'react';

import { Box } from '@/components';
import { Footer } from '@/features/footer/Footer';
import { Header } from '@/features/header';

export function PageLayout({ children }: PropsWithChildren) {
  return (
    <Box>
      <Header />
      <Box as="main" $width="100%">
        {children}
      </Box>
      <Footer />
    </Box>
  );
}
