import type { ReactElement } from 'react';

import { DocsGridList } from '@/features/docs/docs-grid/components/DocsGridList';
import { MainLayout, MainLayoutBackgroundColor } from '@/layouts';
import { NextPageWithLayout } from '@/types/next';

const Page: NextPageWithLayout = () => {
  return <DocsGridList />;
};

Page.getLayout = function getLayout(page: ReactElement) {
  return (
    <MainLayout backgroundColor={MainLayoutBackgroundColor.GREY}>
      {page}
    </MainLayout>
  );
};

export default Page;
