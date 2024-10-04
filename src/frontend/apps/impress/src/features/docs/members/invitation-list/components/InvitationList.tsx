import { Loader } from '@openfun/cunningham-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
          doc={doc}
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
  const [, setRefInitialized] = useState(false);
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

  /**
   *  The "return null;" statement below blocks a necessary rerender
   *  for the InfiniteScroll component to work properly.
   *  This useEffect is a workaround to force the rerender.
   */
  useEffect(() => {
    if (containerRef.current) {
      setRefInitialized(true);
    }
  }, [invitations?.length]);

  if (!invitations?.length) {
    return null;
  }

  return (
    <Card
      $margin="tiny"
      $overflow="auto"
      $maxHeight="50vh"
      $padding="tiny"
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
          role="listbox"
          $padding="none"
          $margin="none"
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
