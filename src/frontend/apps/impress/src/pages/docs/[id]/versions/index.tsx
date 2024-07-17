import { NextPageWithLayout } from '@/types/next';

import { DocLayout } from '../index';

const Page: NextPageWithLayout = () => {
  return null;
};

Page.getLayout = function getLayout() {
  return <DocLayout />;
};

export default Page;
