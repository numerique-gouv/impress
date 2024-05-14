import { Gaufre } from '@gouvfr-lasuite/integration';
import '@gouvfr-lasuite/integration/dist/css/gaufre.css';
import Script from 'next/script';
import React from 'react';

export const LaGaufre = () => (
  <>
    <Script
      src="https://integration.lasuite.numerique.gouv.fr/api/v1/gaufre.js"
      strategy="lazyOnload"
      id="lasuite-gaufre-script"
    />
    <Gaufre />
  </>
);
