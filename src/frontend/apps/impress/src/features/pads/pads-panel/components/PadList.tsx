import { Loader } from '@openfun/cunningham-react';
import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Text } from '@/components';
import { InfiniteScroll } from '@/components/InfiniteScroll';
import { Pad } from '@/features/pads/pad';

import { usePads } from '../api';
import { usePadStore } from '../store';

import { PadItem } from './PadItem';

interface PanelTeamsStateProps {
  isLoading: boolean;
  isError: boolean;
  pads?: Pad[];
}

const PadListState = ({ isLoading, isError, pads }: PanelTeamsStateProps) => {
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

  if (!pads?.length) {
    return (
      <Box $justify="center" className="m-s">
        <Text as="p" className="mb-0 mt-0" $theme="greyscale" $variation="500">
          {t('0 group to display.')}
        </Text>
        <Text as="p" $theme="greyscale" $variation="500">
          {t(
            'Create your first pad by clicking on the "Create a new pad" button.',
          )}
        </Text>
      </Box>
    );
  }

  return pads.map((pad) => <PadItem pad={pad} key={pad.id} />);
};

export const PadList = () => {
  const ordering = usePadStore((state) => state.ordering);
  const {
    data,
    isError,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePads({
    ordering,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const pads = useMemo(() => {
    return data?.pages.reduce((acc, page) => {
      return acc.concat(page.results);
    }, [] as Pad[]);
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
        <PadListState isLoading={isLoading} isError={isError} pads={pads} />
      </InfiniteScroll>
    </Box>
  );
};
