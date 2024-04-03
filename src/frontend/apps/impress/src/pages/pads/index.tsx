import { Button } from '@openfun/cunningham-react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Box, StyledLink } from '@/components';
import { PadLayout } from '@/layouts';
import { NextPageWithLayout } from '@/types/next';

const StyledButton = styled(Button)`
  width: fit-content;
`;

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();

  return (
    <Box $align="center" $justify="center" $height="inherit">
      <StyledLink href="/pads/create">
        <StyledButton>{t('Create a new pad')}</StyledButton>
      </StyledLink>
    </Box>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <PadLayout>{page}</PadLayout>;
};

export default Page;
