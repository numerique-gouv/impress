import type { ReactElement } from 'react';

import { DocsGridContainer } from '@/features/docs/docs-grid';
import { MainLayout } from '@/layouts';
import { NextPageWithLayout } from '@/types/next';

const Page: NextPageWithLayout = () => {
  return <DocsGridContainer />;
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Page;
