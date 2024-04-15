import { Loader } from '@openfun/cunningham-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useRouter } from 'next/router';
import { ReactElement } from 'react';

import { Box } from '@/components';
import { TextErrors } from '@/components/TextErrors';
import { TemplateEditor, useTemplate } from '@/features/templates/template';
import { TemplateLayout } from '@/layouts';
import { NextPageWithLayout } from '@/types/next';

const Page: NextPageWithLayout = () => {
  const {
    query: { id },
  } = useRouter();

  if (typeof id !== 'string') {
    throw new Error('Invalid template id');
  }

  return <Template id={id} />;
};

interface TemplateProps {
  id: string;
}

const Template = ({ id }: TemplateProps) => {
  const { data: template, isLoading, isError, error } = useTemplate({ id });
  const navigate = useNavigate();

  if (isError && error) {
    if (error.status === 404) {
      navigate.replace(`/404`);
      return null;
    }

    return <TextErrors causes={error.cause} />;
  }

  if (isLoading || !template) {
    return (
      <Box $align="center" $justify="center" $height="100%">
        <Loader />
      </Box>
    );
  }

  return <TemplateEditor template={template} />;
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <TemplateLayout>{page}</TemplateLayout>;
};

export default Page;
