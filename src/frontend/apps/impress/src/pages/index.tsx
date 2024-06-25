import type { ReactElement } from 'react';

import { DocLayout } from '@/layouts';
import { NextPageWithLayout } from '@/types/next';

import Docs from './docs';

const Page: NextPageWithLayout = () => {
  return <Docs />;
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <DocLayout>{page}</DocLayout>;
};

export default Page;
