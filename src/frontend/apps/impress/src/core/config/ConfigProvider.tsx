import { Loader } from '@openfun/cunningham-react';
import { PropsWithChildren, useEffect } from 'react';

import { Box } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import i18n from '@/i18n/initI18n';
import { configureCrispSession } from '@/services';
import { useSentryStore } from '@/stores/useSentryStore';

import { useAuthStore } from '../auth';

import { useConfig } from './api/useConfig';

export const ConfigProvider = ({ children }: PropsWithChildren) => {
  const { userData } = useAuthStore();
  const { data: conf } = useConfig();
  const { setSentry } = useSentryStore();
  const { setTheme } = useCunninghamTheme();

  useEffect(() => {
    if (!conf?.SENTRY_DSN) {
      return;
    }

    setSentry(conf.SENTRY_DSN, conf.ENVIRONMENT);
  }, [conf?.SENTRY_DSN, conf?.ENVIRONMENT, setSentry]);

  useEffect(() => {
    if (!conf?.FRONTEND_THEME) {
      return;
    }

    setTheme(conf.FRONTEND_THEME);
  }, [conf?.FRONTEND_THEME, setTheme]);

  useEffect(() => {
    if (!conf?.CRISP_WEBSITE_ID) {
      return;
    }

    configureCrispSession(conf.CRISP_WEBSITE_ID);
  }, [conf?.CRISP_WEBSITE_ID]);

  useEffect(() => {
    if (!userData?.language || !conf?.LANGUAGES) {
      return;
    }

    conf.LANGUAGES.some(([available_lang]) => {
      if (
        userData.language === available_lang && // language is expected by user
        i18n.language !== available_lang // language not set as expected
      ) {
        void i18n.changeLanguage(available_lang); // change language to expected
        return true;
      }
      return false;
    });
  }, [conf?.LANGUAGES, userData?.language]);

  if (!conf) {
    return (
      <Box $height="100vh" $width="100vw" $align="center" $justify="center">
        <Loader />
      </Box>
    );
  }

  return children;
};
