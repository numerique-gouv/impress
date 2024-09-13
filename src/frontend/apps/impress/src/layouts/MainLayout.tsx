import { Box } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { Footer } from '@/features/footer/Footer';
import { HEADER_HEIGHT, Header } from '@/features/header';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { colorsTokens } = useCunninghamTheme();

  return (
    <Box>
      <Box $minHeight="100vh">
        <Header />
        <Box $css="flex: 1;" $direction="row">
          <Box
            as="main"
            $minHeight={`calc(100vh - ${HEADER_HEIGHT})`}
            $width="100%"
            $background="var(--c--components--main--background)"
          >
            {children}
          </Box>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}
