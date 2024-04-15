import { ReactElement } from 'react';

import { Box } from '@/components';
import { CardCreateTemplate } from '@/features/templates/';
import { TemplateLayout } from '@/layouts';
import { NextPageWithLayout } from '@/types/next';

const Page: NextPageWithLayout = () => {
  return (
    <Box className="p-l" $justify="center" $align="start" $height="inherit">
      <CardCreateTemplate />
    </Box>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <TemplateLayout>{page}</TemplateLayout>;
};

export default Page;
