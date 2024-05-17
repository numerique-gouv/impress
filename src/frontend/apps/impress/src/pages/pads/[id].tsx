import { Loader } from '@openfun/cunningham-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useRouter } from 'next/router';
import { ReactElement } from 'react';

import { Box } from '@/components';
import { TextErrors } from '@/components/TextErrors';
import { PadEditor, usePad } from '@/features/pads/pad';
import { PadLayout } from '@/layouts';
import { NextPageWithLayout } from '@/types/next';

const Page: NextPageWithLayout = () => {
  const {
    query: { id },
  } = useRouter();

  if (typeof id !== 'string') {
    return null;
  }

  return <Pad id={id} />;
};

interface PadProps {
  id: string;
}

const Pad = ({ id }: PadProps) => {
  const { data: pad, isLoading, isError, error } = usePad({ id });
  const navigate = useNavigate();

  if (isError && error) {
    if (error.status === 404) {
      navigate.replace(`/404`);
      return null;
    }

    return <TextErrors causes={error.cause} />;
  }

  if (isLoading || !pad) {
    return (
      <Box $align="center" $justify="center" $height="100%">
        <Loader />
      </Box>
    );
  }

  return <PadEditor pad={pad} />;
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <PadLayout>{page}</PadLayout>;
};

export default Page;
