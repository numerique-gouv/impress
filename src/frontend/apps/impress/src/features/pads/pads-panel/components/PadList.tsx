import { Loader } from '@openfun/cunningham-react';
import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { APIError } from '@/api';
import { Box, Text, TextErrors } from '@/components';
import { InfiniteScroll } from '@/components/InfiniteScroll';
import { Pad, usePads } from '@/features/pads/pad-management';

import { usePadPanelStore } from '../store';

import { PadItem } from './PadItem';

interface PanelTeamsStateProps {
  isLoading: boolean;
  error: APIError<unknown> | null;
  pads?: Pad[];
}

const PadListState = ({ isLoading, error, pads }: PanelTeamsStateProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Box $align="center" $margin="large">
        <Loader />
      </Box>
    );
  }

  if (!pads?.length && !error) {
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
      {pads?.map((pad) => <PadItem pad={pad} key={pad.id} />)}
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

export const PadList = () => {
  const ordering = usePadPanelStore((state) => state.ordering);
  const {
    data,
    error,
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
        <PadListState isLoading={isLoading} error={error} pads={pads} />
      </InfiniteScroll>
    </Box>
  );
};
