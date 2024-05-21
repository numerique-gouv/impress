import { Loader } from '@openfun/cunningham-react';
import { usePathname, useRouter } from 'next/navigation';
import { PropsWithChildren, useEffect, useState } from 'react';

import { Box } from '@/components';

import { useAuthStore } from './useAuthStore';
export const Auth = ({ children }: PropsWithChildren) => {
  const { authenticated, initAuth } = useAuthStore();
  const router = useRouter();
  const [isDomainComingSoon, setIsDomainComingSoon] = useState(false);
  const domainComingSoon = 'docs.numerique.gouv.fr';
  const pathComingSoon = '/coming-soon/';
  const pathname = usePathname();

  useEffect(() => {
    if (window.location.origin.includes(domainComingSoon)) {
      router.push(pathComingSoon);
      return;
    }

    initAuth();
  }, [initAuth, router]);

  useEffect(() => {
    setIsDomainComingSoon(
      window.location.origin.includes(domainComingSoon) &&
        pathname === pathComingSoon,
    );
  }, [pathname]);

  if (!authenticated && !isDomainComingSoon) {
    return (
      <Box $height="100vh" $width="100vw" $align="center" $justify="center">
        <Loader />
      </Box>
    );
  }

  return children;
};
