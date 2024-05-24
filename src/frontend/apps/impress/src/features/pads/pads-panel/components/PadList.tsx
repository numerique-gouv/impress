import { Loader } from '@openfun/cunningham-react';
import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Text } from '@/components';
import { InfiniteScroll } from '@/components/InfiniteScroll';
import { Pad, usePads } from '@/features/pads/pad-management';

import { usePadPanelStore } from '../store';

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
      <Box $justify="center" $margin={{ bottom: 'big' }}>
        <Text $theme="danger" $align="center" $textAlign="center">
          {t('Something bad happens, please refresh the page.')}
        </Text>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box $align="center" $margin="large">
        <Loader />
      </Box>
    );
  }

  if (!pads?.length) {
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
            'Create your first pad by clicking on the "Create a new pad" button.',
          )}
        </Text>
      </Box>
    );
  }

  return pads.map((pad) => <PadItem pad={pad} key={pad.id} />);
};

export const PadList = () => {
  const ordering = usePadPanelStore((state) => state.ordering);
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
        $padding="none"
        $margin={{ top: 'none' }}
        role="listbox"
      >
        <PadListState isLoading={isLoading} isError={isError} pads={pads} />
      </InfiniteScroll>
    </Box>
  );
};
