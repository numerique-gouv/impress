import { Loader } from '@openfun/cunningham-react';
import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Text } from '@/components';
import { InfiniteScroll } from '@/components/InfiniteScroll';
import { Template } from '@/features/templates/template';

import { useTemplates } from '../api';
import { useTemplatePanelStore } from '../store';

import { TemplateItem } from './TemplateItem';

interface PanelTeamsStateProps {
  isLoading: boolean;
  isError: boolean;
  templates?: Template[];
}

const TemplateListState = ({
  isLoading,
  isError,
  templates,
}: PanelTeamsStateProps) => {
  const { t } = useTranslation();

  if (isError) {
    return (
      <Box $justify="center" className="mb-b">
        <Text $theme="danger" $align="center" $textAlign="center">
          {t('Something bad happens, please refresh the page.')}
        </Text>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box $align="center" className="m-l">
        <Loader />
      </Box>
    );
  }

  if (!templates?.length) {
    return (
      <Box $justify="center" className="m-s">
        <Text as="p" className="mb-0 mt-0" $theme="greyscale" $variation="500">
          {t('0 group to display.')}
        </Text>
        <Text as="p" $theme="greyscale" $variation="500">
          {t(
            'Create your first template by clicking on the "Create a new template" button.',
          )}
        </Text>
      </Box>
    );
  }

  return templates.map((template) => (
    <TemplateItem template={template} key={template.id} />
  ));
};

export const TemplateList = () => {
  const ordering = useTemplatePanelStore((state) => state.ordering);
  const {
    data,
    isError,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTemplates({
    ordering,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const templates = useMemo(() => {
    return data?.pages.reduce((acc, page) => {
      return acc.concat(page.results);
    }, [] as Template[]);
  }, [data?.pages]);

  return (
    <Box $css="overflow-y: auto; overflow-x: hidden;" ref={containerRef}>
      <InfiniteScroll
        hasMore={hasNextPage}
        isLoading={isFetchingNextPage}
        next={() => {
          void fetchNextPage();
        }}
        scrollContainer={containerRef.current}
        as="ul"
        className="p-0 mt-0"
        role="listbox"
      >
        <TemplateListState
          isLoading={isLoading}
          isError={isError}
          templates={templates}
        />
      </InfiniteScroll>
    </Box>
  );
};
