import { DataGrid, SortModel, usePagination } from '@openfun/cunningham-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createGlobalStyle } from 'styled-components';

import { Card, StyledLink, Text, TextErrors } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import {
  Doc,
  DocsOrdering,
  LinkReach,
  currentDocRole,
  isDocsOrdering,
  useDocs,
  useTrans,
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

export const DocsGrid = () => {
  const { colorsTokens } = useCunninghamTheme();
  const { transRole } = useTrans();
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
      $padding={{ bottom: 'small', horizontal: 'big' }}
      $margin={{ all: 'big', top: 'none' }}
      $overflow="auto"
      aria-label={t(`Datagrid of the documents page {{page}}`, { page })}
    >
      <DocsGridStyle />
      <Text
        $weight="bold"
        as="h2"
        $theme="primary"
        $margin={{ bottom: 'none' }}
      >
        {t('Documents')}
      </Text>

      {error && <TextErrors causes={error.cause} />}

      <DataGrid
        columns={[
          {
            headerName: '',
            id: 'visibility',
            size: 95,
            renderCell: ({ row }) => {
              return (
                <StyledLink href={`/docs/${row.id}`}>
                  {row.link_reach === LinkReach.PUBLIC && (
                    <Text
                      $weight="bold"
                      $background={colorsTokens()['primary-600']}
                      $color="white"
                      $padding="xtiny"
                      $radius="3px"
                    >
                      {t('Public')}
                    </Text>
                  )}
                </StyledLink>
              );
            },
          },
          {
            headerName: t('Document name'),
            field: 'title',
            renderCell: ({ row }) => {
              return (
                <StyledLink href={`/docs/${row.id}`}>
                  <Text $weight="bold" $theme="primary">
                    {row.title}
                  </Text>
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
                  <Text $weight="bold">{formatDate(row.created_at)}</Text>
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
                  <Text $weight="bold">{formatDate(row.updated_at)}</Text>
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
                  <Text $weight="bold">
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
                  <Text $weight="bold">{row.accesses.length}</Text>
                </StyledLink>
              );
            },
          },
          {
            id: 'column-actions',
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
