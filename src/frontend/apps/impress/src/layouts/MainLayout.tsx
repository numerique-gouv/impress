import { Box } from '@/components';
import { Footer } from '@/features/footer/Footer';
import { HEADER_HEIGHT, Header } from '@/features/header';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box $height="100vh">
        <Header />
        <Box $css="flex: 1;" $direction="row">
          <Box
            as="main"
            $height={`calc(100vh - ${HEADER_HEIGHT})`}
            $width="100%"
          >
            {children}
          </Box>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}
