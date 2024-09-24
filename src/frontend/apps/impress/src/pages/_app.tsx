import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';

import { AppProvider } from '@/core/';
import { useSWRegister } from '@/features/service-worker/';
import { useSupport } from '@/hook/useSupport';
import { NextPageWithLayout } from '@/types/next';

import './globals.css';

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  useSWRegister();
  const getLayout = Component.getLayout ?? ((page) => page);
  const { t } = useTranslation();

  // Initialize Crisp, the support chat used among all La Suite products
  useSupport();

  return (
    <>
      <Head>
        <title>{t('Docs')}</title>
        <meta
          name="description"
          content={t(
            'Docs: Your new companion to collaborate on documents efficiently, intuitively, and securely.',
          )}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </Head>
      <AppProvider>{getLayout(<Component {...pageProps} />)}</AppProvider>
    </>
  );
}
