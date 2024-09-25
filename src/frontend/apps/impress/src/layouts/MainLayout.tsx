import { Box } from '@/components';
import { Header } from '@/features/header';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <Box $minHeight="100vh">
        <Header />
        <Box $css="flex: 1;" $direction="row">
          <Box as="main" $width="100%">
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
