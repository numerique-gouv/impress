import { PropsWithChildren } from 'react';

import { useConfig } from './api/useConfig';

export const ConfigProvider = ({ children }: PropsWithChildren) => {
  useConfig();

  return children;
};
