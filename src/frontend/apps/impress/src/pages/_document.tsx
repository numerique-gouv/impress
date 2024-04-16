import { Head, Html, Main, NextScript } from 'next/document';

import '@/i18n/initI18n';

/**
 * About the Gaufre Vanilla CSS
 * To respect next.js standards, the css is included here.
 * This css is used with features/header/ApplicationsMenu component.
 * If the ApplicationsMenu component is removed, this css can be removed as well.
 */
export default function RootLayout() {
  return (
    <Html lang="en">
      <Head />
      <body suppressHydrationWarning={process.env.NODE_ENV === 'development'}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
