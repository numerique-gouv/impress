import { useEffect } from 'react';

export const useSWRegister = () => {
  useEffect(() => {
    if (
      'serviceWorker' in navigator &&
      process.env.NEXT_PUBLIC_SW_DEACTIVATED !== 'true'
    ) {
      navigator.serviceWorker
        .register(`/service-worker.js?v=${process.env.NEXT_PUBLIC_BUILD_ID}`)
        .catch((err) => {
          console.error('Service worker registration failed:', err);
        });
    }
  }, []);
};
