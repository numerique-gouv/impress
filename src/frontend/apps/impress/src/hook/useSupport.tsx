import { Crisp } from 'crisp-sdk-web';
import { useEffect } from 'react';

import { User } from '@/core';

export const initializeSupportSession = (user: User) => {
  if (!Crisp.isCrispInjected()) return;
  Crisp.setTokenId(user.id);
  Crisp.user.setEmail(user.email);
};

export const terminateSupportSession = () => {
  if (!Crisp.isCrispInjected()) return;
  Crisp.setTokenId();
  Crisp.session.reset();
};

/**
 * Configure Crisp chat for real-time support across all pages.
 */
export const useSupport = () => {
  useEffect(() => {
    const CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

    if (!CRISP_WEBSITE_ID) {
      console.warn('Crisp Website ID is not set');
      return;
    }
    if (Crisp.isCrispInjected()) return;
    Crisp.configure(CRISP_WEBSITE_ID);
  }, []);

  return null;
};
