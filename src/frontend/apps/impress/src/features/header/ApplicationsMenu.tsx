import Script from 'next/script';
import React from 'react';

/**
 * ApplicationsMenu Component
 *
 * This component is a work in progress (WIP) and serves as a proof of concept (POC) to showcase a future advanced feature.
 * The purpose of this component is to render an applications menu for La Suite, allowing users to switch between different La Suite apps seamlessly.
 * To ensure synchronized content across applications, it utilizes an iframe hosted on Scalingo.
 *
 * This PoC has been created by @manuhabitela.
 *
 * It includes external CSS and JavaScript files for styling and functionality.
 *
 * Style has to be included as well: https://suite-numerique-gaufre.osc-fr1.scalingo.io/public/styles/gaufre-vanilla.css \
 * To respect next.js standards, the css is included using the `_document.ts` component.
 * @see https://github.com/numerique-gouv/impress/blob/main/src/frontend/apps/impress/src/pages/_document.tsx#L8
 */
export const ApplicationsMenu = () => (
  <>
    <Script
      src="https://suite-numerique-gaufre.osc-fr1.scalingo.io/public/widget.js"
      strategy="lazyOnload"
    />
    <button
      style={{ marginLeft: '1.5rem', verticalAlign: 'center' }}
      type="button"
      className="lasuitenumerique-gaufre-btn lasuitenumerique-gaufre-btn--vanilla"
      title="Les applications de La Suite numérique"
    >
      Les applications de La Suite numérique
    </button>
  </>
);
