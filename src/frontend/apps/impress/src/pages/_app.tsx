import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { AppProvider } from '@/core/';
import { NextPageWithLayout } from '@/types/next';

import './globals.css';

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);
  const { t } = useTranslation();

  useEffect(() => {
    if (
      'serviceWorker' in navigator &&
      process.env.NEXT_PUBLIC_SW_DEACTIVATED !== 'true'
    ) {
      navigator.serviceWorker.register('/service-worker.js').catch((err) => {
        console.error('Service worker registration failed:', err);
      });
    }
  }, []);

  return (
    <>
      <Head>
        <title>{t('Docs')}</title>
        <meta name="description" content={t('Docs Description')} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </Head>
      <AppProvider>{getLayout(<Component {...pageProps} />)}</AppProvider>
    </>
  );
}
