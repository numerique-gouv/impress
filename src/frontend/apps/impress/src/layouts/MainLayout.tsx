import { Box } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { Header } from '@/features/header';

export function MainLayout({ children }: { children: React.ReactNode }) {
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
    </Box>
  );
}
