import { Loader } from '@openfun/cunningham-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useRouter } from 'next/router';
import { ReactElement } from 'react';

import { Box, Text, TextErrors } from '@/components/';
import { PadEditor } from '@/features/pads/pad-editor';
import { usePad } from '@/features/pads/pad-management';
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

    return (
      <Box $margin="large">
        <TextErrors
          causes={error.cause}
          icon={
            error.status === 502 ? (
              <Text className="material-icons" $theme="danger">
                wifi_off
              </Text>
            ) : undefined
          }
        />
      </Box>
    );
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
