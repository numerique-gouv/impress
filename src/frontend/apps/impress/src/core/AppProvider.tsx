import { CunninghamProvider } from '@openfun/cunningham-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useCunninghamTheme } from '@/cunningham';
import '@/i18n/initI18n';

import { Auth } from './auth/';

/**
 * QueryClient:
 *  - defaultOptions:
 *    - staleTime:
 *      - global cache duration - we decided 3 minutes
 *      - It can be overridden to each query
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3,
    },
  },
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useCunninghamTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <CunninghamProvider theme={theme}>
        <Auth>{children}</Auth>
      </CunninghamProvider>
    </QueryClientProvider>
  );
}
