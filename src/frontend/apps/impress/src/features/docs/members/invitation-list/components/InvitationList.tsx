import { Loader } from '@openfun/cunningham-react';
import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { APIError } from '@/api';
import { Box, Card, InfiniteScroll, TextErrors } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { Doc, currentDocRole } from '@/features/docs/doc-management';

import { useDocInvitationsInfinite } from '../api';
import { Invitation } from '../types';

import { InvitationItem } from './InvitationItem';

interface InvitationListStateProps {
  isLoading: boolean;
  error: APIError | null;
  invitations?: Invitation[];
  doc: Doc;
}

const InvitationListState = ({
  invitations,
  error,
  isLoading,
  doc,
}: InvitationListStateProps) => {
  const { colorsTokens } = useCunninghamTheme();

  if (error) {
    return <TextErrors causes={error.cause} />;
  }

  if (isLoading || !invitations) {
    return (
      <Box $align="center" className="m-l">
        <Loader />
      </Box>
    );
  }

  return invitations?.map((invitation, index) => {
    if (!invitation.email) {
      return null;
    }

    return (
      <Box
        key={`${invitation.id}-${index}`}
        $background={!(index % 2) ? 'white' : colorsTokens()['greyscale-000']}
        $direction="row"
        $padding="small"
        $align="center"
        $gap="1rem"
        $radius="4px"
        as="li"
      >
        <InvitationItem
          invitation={invitation}
          role={invitation.role}
          docId={doc.id}
          currentRole={currentDocRole(doc.abilities)}
        />
      </Box>
    );
  });
};

interface InvitationListProps {
  doc: Doc;
}

export const InvitationList = ({ doc }: InvitationListProps) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDocInvitationsInfinite({
    docId: doc.id,
  });

  const invitations = useMemo(() => {
    return data?.pages.reduce((acc, page) => {
      return acc.concat(page.results);
    }, [] as Invitation[]);
  }, [data?.pages]);

  if (!invitations?.length) {
    return null;
  }

  return (
    <Card
      $margin="tiny"
      $padding="tiny"
      $maxHeight="40%"
      $overflow="auto"
      aria-label={t('List invitation card')}
    >
      <Box ref={containerRef} $overflow="auto">
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
          <InvitationListState
            isLoading={isLoading}
            error={error}
            invitations={invitations}
            doc={doc}
          />
        </InfiniteScroll>
      </Box>
    </Card>
  );
};
