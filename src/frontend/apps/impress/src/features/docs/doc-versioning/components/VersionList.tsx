import { Loader } from '@openfun/cunningham-react';
import { useRouter } from 'next/router';
import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { APIError } from '@/api';
import { Box, InfiniteScroll, Text, TextErrors } from '@/components';
import { Doc } from '@/features/docs/doc-management';
import { useDate } from '@/hook';

import { useDocVersionsInfiniteQuery } from '../api/useDocVersions';
import { Versions } from '../types';

import { VersionItem } from './VersionItem';

interface VersionListStateProps {
  isLoading: boolean;
  error: APIError<unknown> | null;
  versions?: Versions[];
  doc: Doc;
}

const VersionListState = ({
  isLoading,
  error,
  versions,
  doc,
}: VersionListStateProps) => {
  const { t } = useTranslation();
  const { formatDate } = useDate();
  const {
    query: { versionId },
  } = useRouter();

  if (isLoading) {
    return (
      <Box $align="center" $margin="large">
        <Loader />
      </Box>
    );
  }

  return (
    <>
      <VersionItem
        text={t('Current version')}
        versionId={undefined}
        link={`/docs/${doc.id}/`}
        docId={doc.id}
        isActive={!versionId}
      />
      {versions?.map((version) => (
        <VersionItem
          key={version.version_id}
          versionId={version.version_id}
          text={formatDate(version.last_modified, {
            dateStyle: 'long',
            timeStyle: 'short',
          })}
          link={`/docs/${doc.id}/versions/${version.version_id}`}
          docId={doc.id}
          isActive={version.version_id === versionId}
        />
      ))}
      {error && (
        <Box
          $justify="center"
          $margin={{ vertical: 'small', horizontal: 'small' }}
        >
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
      )}
    </>
  );
};

interface VersionListProps {
  doc: Doc;
}

export const VersionList = ({ doc }: VersionListProps) => {
  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDocVersionsInfiniteQuery({
    docId: doc.id,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const versions = useMemo(() => {
    return data?.pages.reduce((acc, page) => {
      return acc.concat(page.results);
    }, [] as Versions[]);
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
        <VersionListState
          isLoading={isLoading}
          error={error}
          versions={versions}
          doc={doc}
        />
      </InfiniteScroll>
    </Box>
  );
};
