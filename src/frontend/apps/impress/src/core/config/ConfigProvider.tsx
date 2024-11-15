import { PropsWithChildren, useEffect } from 'react';

import { useSentryStore } from '@/stores/useSentryStore';

import { useConfig } from './api/useConfig';

export const ConfigProvider = ({ children }: PropsWithChildren) => {
  const { data: conf } = useConfig();
  const { setSentry } = useSentryStore();

  useEffect(() => {
    if (!conf?.SENTRY_DSN) {
      return;
    }

    setSentry(conf.SENTRY_DSN, conf.ENVIRONMENT);
  }, [conf?.SENTRY_DSN, conf?.ENVIRONMENT, setSentry]);

  return children;
};
