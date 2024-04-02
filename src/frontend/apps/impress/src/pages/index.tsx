import type { ReactElement } from 'react';

import { TeamLayout } from '@/features/teams/';
import { NextPageWithLayout } from '@/types/next';

import Teams from './teams/';

const Page: NextPageWithLayout = () => {
  return <Teams />;
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <TeamLayout>{page}</TeamLayout>;
};

export default Page;
