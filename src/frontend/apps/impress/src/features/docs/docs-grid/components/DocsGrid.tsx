import { DataGrid, SortModel, usePagination } from '@openfun/cunningham-react';
import React, { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createGlobalStyle } from 'styled-components';

import { Box, Card, StyledLink, Text, TextErrors } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import {
  Doc,
  DocsOrdering,
  currentDocRole,
  isDocsOrdering,
  useDocs,
  useTransRole,
} from '@/features/docs/doc-management';
import { useDate } from '@/hook/';

import { PAGE_SIZE } from '../conf';

import { DocsGridActions } from './DocsGridActions';

const DocsGridStyle = createGlobalStyle`
  & .c__datagrid thead{
    position: sticky;
    top: 0;
    background: #fff;
    z-index: 1;
  }
  & .c__pagination__goto{
    display:none; 
  }
`;

type SortModelItem = {
  field: string;
  sort: 'asc' | 'desc' | null;
};

function formatSortModel(sortModel: SortModelItem): DocsOrdering | undefined {
  const { field, sort } = sortModel;
  const orderingField = sort === 'desc' ? `-${field}` : field;

  if (isDocsOrdering(orderingField)) {
    return orderingField;
  }
}

export const DocsGrid = ({ topSlot }: { topSlot?: ReactNode }) => {
  const { colorsTokens } = useCunninghamTheme();
  const transRole = useTransRole();
  const { t } = useTranslation();
  const { formatDate } = useDate();
  const pagination = usePagination({
    pageSize: PAGE_SIZE,
  });
  const [sortModel, setSortModel] = useState<SortModel>([
    {
      field: 'updated_at',
      sort: 'desc',
    },
  ]);
  const { page, pageSize, setPagesCount } = pagination;
  const [docs, setDocs] = useState<Doc[]>([]);

  const ordering = sortModel.length ? formatSortModel(sortModel[0]) : undefined;

  const { data, isLoading, error } = useDocs({
    page,
    ordering,
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setDocs(data?.results || []);
  }, [data?.results, t, isLoading]);

  useEffect(() => {
    setPagesCount(data?.count ? Math.ceil(data.count / pageSize) : 0);
  }, [data?.count, pageSize, setPagesCount]);

  return (
    <Card
      $margin={{ all: 'big' }}
      $overflow="auto"
      aria-label={t(`Datagrid of the documents page {{page}}`, { page })}
    >
      <DocsGridStyle />
      <Box
        style={{
          padding: '1.5rem 3rem',
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <Text
          $weight="bold"
          as="h2"
          $color="var(--c--components--card--title-color)"
        >
          {t('Documents')}
        </Text>
        <div>{topSlot}</div>
      </Box>
      {error && <TextErrors causes={error.cause} />}

      <DataGrid
        columns={[
          {
            headerName: t('Document name'),
            field: 'title',
            renderCell: ({ row }) => {
              return (
                <StyledLink href={`/docs/${row.id}`}>
                  <Text $weight="bold" $theme="greyscale" $variation="900">
                    {row.title}
                  </Text>
                </StyledLink>
              );
            },
          },
          {
            headerName: '',
            id: 'visibility',
            size: 95,
            renderCell: ({ row }) => {
              return (
                <StyledLink href={`/docs/${row.id}`}>
                  {row.is_public && (
                    <Text
                      $weight="var(--c--components--pill--bold)"
                      $background="var(--c--components--pill--background)"
                      $color="var(--c--components--pill--color)"
                      $padding={{
                        horizontal: 'var(--c--components--pill--padding-x)',
                        vertical: 'var(--c--components--pill--padding-y)',
                      }}
                      $radius="var(--c--components--pill--radius)"
                    >
                      {row.is_public ? t('Public') : ''}
                    </Text>
                  )}
                </StyledLink>
              );
            },
          },
          {
            headerName: t('Created at'),
            field: 'created_at',
            renderCell: ({ row }) => {
              return (
                <StyledLink href={`/docs/${row.id}`}>
                  <Text $theme="greyscale" $variation="900">
                    {formatDate(row.created_at)}
                  </Text>
                </StyledLink>
              );
            },
          },
          {
            headerName: t('Updated at'),
            field: 'updated_at',
            renderCell: ({ row }) => {
              return (
                <StyledLink href={`/docs/${row.id}`}>
                  <Text $theme="greyscale" $variation="900">
                    {formatDate(row.updated_at)}
                  </Text>
                </StyledLink>
              );
            },
          },
          {
            headerName: t('Your role'),
            id: 'your_role',
            renderCell: ({ row }) => {
              return (
                <StyledLink href={`/docs/${row.id}`}>
                  <Text $theme="greyscale" $variation="900">
                    {transRole(currentDocRole(row.abilities))}
                  </Text>
                </StyledLink>
              );
            },
          },
          {
            headerName: t('Members'),
            id: 'users_number',
            renderCell: ({ row }) => {
              return (
                <StyledLink href={`/docs/${row.id}`}>
                  <Text $theme="greyscale" $variation="900">
                    {row.accesses.length}
                  </Text>
                </StyledLink>
              );
            },
          },
          {
            id: 'actions',
            renderCell: ({ row }) => {
              return <DocsGridActions doc={row} />;
            },
          },
        ]}
        rows={docs}
        isLoading={isLoading}
        pagination={pagination}
        onSortModelChange={setSortModel}
        sortModel={sortModel}
        emptyPlaceholderLabel={t("You don't have any document yet.")}
      />
    </Card>
  );
};
