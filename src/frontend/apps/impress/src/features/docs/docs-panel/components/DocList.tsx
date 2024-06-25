import { Loader } from '@openfun/cunningham-react';
import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { APIError } from '@/api';
import { Box, Text, TextErrors } from '@/components';
import { InfiniteScroll } from '@/components/InfiniteScroll';
import { Doc, useDocs } from '@/features/docs/doc-management';

import { useDocPanelStore } from '../store';

import { DocItem } from './DocItem';

interface PanelTeamsStateProps {
  isLoading: boolean;
  error: APIError<unknown> | null;
  docs?: Doc[];
}

const DocListState = ({ isLoading, error, docs }: PanelTeamsStateProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Box $align="center" $margin="large">
        <Loader />
      </Box>
    );
  }

  if (!docs?.length && !error) {
    return (
      <Box $justify="center" $margin="small">
        <Text
          as="p"
          $margin={{ vertical: 'none' }}
          $theme="greyscale"
          $variation="500"
        >
          {t('0 group to display.')}
        </Text>
        <Text as="p" $theme="greyscale" $variation="500">
          {t(
            'Create your first document by clicking on the "Create a new document" button.',
          )}
        </Text>
      </Box>
    );
  }

  return (
    <>
      {docs?.map((doc) => <DocItem doc={doc} key={doc.id} />)}
      {error && (
        <Box
          $justify="center"
          $margin={{ vertical: 'big', horizontal: 'auto' }}
        >
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
      )}
    </>
  );
};

export const DocList = () => {
  const ordering = useDocPanelStore((state) => state.ordering);
  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDocs({
    ordering,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const docs = useMemo(() => {
    return data?.pages.reduce((acc, page) => {
      return acc.concat(page.results);
    }, [] as Doc[]);
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
        $padding="none"
        $margin={{ top: 'none' }}
        role="listbox"
      >
        <DocListState isLoading={isLoading} error={error} docs={docs} />
      </InfiniteScroll>
    </Box>
  );
};
