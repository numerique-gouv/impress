import { PropsWithChildren, ReactNode } from 'react';

import { Box } from '@/components';

import { DocsHeaderLayout } from './DocsHeaderLayout';
import { DocsLeftLayout } from './DocsLeftLayout';
import styles from './docs-layout.module.scss';

type Props = {
  leftContent?: ReactNode;
  backgroundStyle?: 'white' | 'grey';
};
export const DocsLayout = ({
  children,
  backgroundStyle = 'grey',
  leftContent,
}: PropsWithChildren<Props>) => {
  return (
    <div>
      <DocsHeaderLayout />
      <Box $direction="row" $width="100%">
        <DocsLeftLayout>{leftContent}</DocsLeftLayout>
        <div
          id="mainContent"
          className={[styles.mainContent, styles[backgroundStyle]].join(' ')}
        >
          {children}
        </div>
      </Box>
    </div>
  );
};
