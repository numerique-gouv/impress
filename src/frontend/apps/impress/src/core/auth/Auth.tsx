import { Loader } from '@openfun/cunningham-react';
import { PropsWithChildren, useEffect } from 'react';

import { Box } from '@/components';

import { useAuthStore } from './useAuthStore';
export const Auth = ({ children }: PropsWithChildren) => {
  const { authenticated, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (!authenticated) {
    return (
      <Box $height="100vh" $width="100vw" $align="center" $justify="center">
        <Loader />
      </Box>
    );
  }

  return children;
};
