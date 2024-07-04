import { DataGrid, SortModel, usePagination } from '@openfun/cunningham-react';
import { DateTime, DateTimeFormatOptions } from 'luxon';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createGlobalStyle } from 'styled-components';

import { Card, StyledLink, Text, TextErrors } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import {
  Doc,
  DocsOrdering,
  currentDocRole,
  isDocsOrdering,
  useDocs,
  useTransRole,
} from '@/features/docs/doc-management';

import { PAGE_SIZE } from '../conf';

const DocsGridStyle = createGlobalStyle`
  & .c__datagrid{
    max-height: 91%;
  }
  & .c__datagrid thead{
    position: sticky;
    top: 0;
    background: #fff;
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

const format: DateTimeFormatOptions = {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export const DocsGrid = () => {
  const { colorsTokens } = useCunninghamTheme();
  const transRole = useTransRole();
  const { t, i18n } = useTranslation();
  const pagination = usePagination({
    pageSize: PAGE_SIZE,
  });
  const [sortModel, setSortModel] = useState<SortModel>([]);
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
                  {row.is_public && (
                    <Text
                      $weight="bold"
                      $background={colorsTokens()['primary-600']}
                      $color="white"
                      $padding="xtiny"
                      $radius="3px"
                    >
                      {row.is_public ? 'Public' : ''}
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
              const created_at = DateTime.fromISO(row.created_at)
                .setLocale(i18n.language)
                .toLocaleString(format);

              return (
                <StyledLink href={`/docs/${row.id}`}>
                  <Text $weight="bold">{created_at}</Text>
                </StyledLink>
              );
            },
          },
          {
            headerName: t('Updated at'),
            field: 'updated_at',
            renderCell: ({ row }) => {
              const updated_at = DateTime.fromISO(row.updated_at)
                .setLocale(i18n.language)
                .toLocaleString(format);

              return (
                <StyledLink href={`/docs/${row.id}`}>
                  <Text $weight="bold">{updated_at}</Text>
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
                  <Text $weight="bold">{transRole(currentDocRole(row))}</Text>
                </StyledLink>
              );
            },
          },
          {
            headerName: t('Users number'),
            id: 'users_number',
            renderCell: ({ row }) => {
              return (
                <StyledLink href={`/docs/${row.id}`}>
                  <Text $weight="bold">{row.accesses.length}</Text>
                </StyledLink>
              );
            },
          },
        ]}
        rows={docs}
        isLoading={isLoading}
        pagination={pagination}
        onSortModelChange={setSortModel}
        sortModel={sortModel}
      />
    </Card>
  );
};
