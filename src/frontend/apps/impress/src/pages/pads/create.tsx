import { ReactElement } from 'react';

import { Box } from '@/components';
import { CardCreatePad } from '@/features/pads/';
import { PadLayout } from '@/layouts';
import { NextPageWithLayout } from '@/types/next';

const Page: NextPageWithLayout = () => {
  return (
    <Box $padding="large" $justify="center" $align="start" $height="inherit">
      <CardCreatePad />
    </Box>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <PadLayout>{page}</PadLayout>;
};

export default Page;
