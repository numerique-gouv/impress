import type { ReactElement } from 'react';

import { PadLayout } from '@/layouts';
import { NextPageWithLayout } from '@/types/next';

import Pads from './docs';

const Page: NextPageWithLayout = () => {
  return <Pads />;
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <PadLayout>{page}</PadLayout>;
};

export default Page;
