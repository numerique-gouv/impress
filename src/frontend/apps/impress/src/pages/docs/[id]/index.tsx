import { Loader } from '@openfun/cunningham-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { Box, Text } from '@/components';
import { TextErrors } from '@/components/TextErrors';
import { DocEditor } from '@/features/docs';
import { useDoc } from '@/features/docs/doc-management';
import { MainLayout } from '@/layouts';
import { NextPageWithLayout } from '@/types/next';

export function DocLayout() {
  const {
    query: { id },
  } = useRouter();

  if (typeof id !== 'string') {
    return null;
  }

  return (
    <MainLayout>
      <DocPage id={id} />
    </MainLayout>
  );
}

interface DocProps {
  id: string;
}

const DocPage = ({ id }: DocProps) => {
  const { data: doc, isLoading, isError, error } = useDoc({ id });
  const navigate = useNavigate();

  useEffect(() => {
    if (doc?.title) {
      setTimeout(() => {
        document.title = `${doc.title} - Docs`;
      }, 100);
    }
  }, [doc?.title]);

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
              <Text $isMaterialIcon $theme="danger">
                wifi_off
              </Text>
            ) : undefined
          }
        />
      </Box>
    );
  }

  if (isLoading || !doc) {
    return (
      <Box $align="center" $justify="center" $height="100%">
        <Loader />
      </Box>
    );
  }

  return <DocEditor doc={doc} />;
};

const Page: NextPageWithLayout = () => {
  return null;
};

Page.getLayout = function getLayout() {
  return <DocLayout />;
};

export default Page;
