import { Loader } from '@openfun/cunningham-react';
import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Text } from '@/components';
import { InfiniteScroll } from '@/components/InfiniteScroll';
import { Team, useTeamStore, useTeams } from '@/features/teams/';

import { TeamItem } from './TeamItem';

interface PanelTeamsStateProps {
  isLoading: boolean;
  isError: boolean;
  teams?: Team[];
}

const TeamListState = ({ isLoading, isError, teams }: PanelTeamsStateProps) => {
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

  if (!teams?.length) {
    return (
      <Box $justify="center" className="m-s">
        <Text as="p" className="mb-0 mt-0" $theme="greyscale" $variation="500">
          {t('0 group to display.')}
        </Text>
        <Text as="p" $theme="greyscale" $variation="500">
          {t(
            'Create your first team by clicking on the "Create a new team" button.',
          )}
        </Text>
      </Box>
    );
  }

  return teams.map((team) => <TeamItem team={team} key={team.id} />);
};

export const TeamList = () => {
  const ordering = useTeamStore((state) => state.ordering);
  const {
    data,
    isError,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTeams({
    ordering,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const teams = useMemo(() => {
    return data?.pages.reduce((acc, page) => {
      return acc.concat(page.results);
    }, [] as Team[]);
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
        <TeamListState isLoading={isLoading} isError={isError} teams={teams} />
      </InfiniteScroll>
    </Box>
  );
};
