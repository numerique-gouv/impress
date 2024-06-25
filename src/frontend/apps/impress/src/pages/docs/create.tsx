import { ReactElement } from 'react';

import { Box } from '@/components';
import { CardCreateDoc } from '@/features/docs/doc-management';
import { DocLayout } from '@/layouts';
import { NextPageWithLayout } from '@/types/next';

const Page: NextPageWithLayout = () => {
  return (
    <Box $padding="large" $justify="center" $align="start" $height="inherit">
      <CardCreateDoc />
    </Box>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <DocLayout>{page}</DocLayout>;
};

export default Page;
