import type { ReactElement } from 'react';

import { Box } from '@/components';
import { DocsGrid } from '@/features/docs/docs-grid/components/DocsGrid';
import { DocsLayout } from '@/layouts/docs/DocsLayout';
import { NextPageWithLayout } from '@/types/next';

const Page: NextPageWithLayout = () => {
  return (
    <Box $overflow="auto" $width="100%">
      <DocsGrid />
    </Box>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <DocsLayout>{page}</DocsLayout>;
};

export default Page;
