import { DataGrid, SortModel, usePagination } from '@openfun/cunningham-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, TextErrors } from '@/components';
import { Doc, Role, currentDocRole } from '@/features/docs/doc-management';

import { useDocAccesses } from '../api';
import { PAGE_SIZE } from '../conf';

import { MemberAction } from './MemberAction';

interface MemberGridProps {
  doc: Doc;
}

// FIXME : ask Cunningham to export this type
type SortModelItem = {
  field: string;
  sort: 'asc' | 'desc' | null;
};

const defaultOrderingMapping: Record<string, string> = {
  'user.name': 'name',
  'user.email': 'email',
  localizedRole: 'role',
};

/**
 * Formats the sorting model based on a given mapping.
 * @param {SortModelItem} sortModel The sorting model item containing field and sort direction.
 * @param {Record<string, string>} mapping The mapping object to map field names.
 * @returns {string} The formatted sorting string.
 */
function formatSortModel(
  sortModel: SortModelItem,
  mapping = defaultOrderingMapping,
) {
  const { field, sort } = sortModel;
  const orderingField = mapping[field] || field;
  return sort === 'desc' ? `-${orderingField}` : orderingField;
}

export const MemberGrid = ({ doc }: MemberGridProps) => {
  const { t } = useTranslation();
  const pagination = usePagination({
    pageSize: PAGE_SIZE,
  });
  const [sortModel, setSortModel] = useState<SortModel>([]);
  const { page, pageSize, setPagesCount } = pagination;

  const ordering = sortModel.length ? formatSortModel(sortModel[0]) : undefined;

  const { data, isLoading, error } = useDocAccesses({
    docId: doc.id,
    page,
    ordering,
  });

  const translatedRoles = {
    [Role.ADMIN]: t('Administrator'),
    [Role.READER]: t('Reader'),
    [Role.OWNER]: t('Owner'),
    [Role.EDITOR]: t('Editor'),
  };

  /*
   * Bug occurs from the Cunningham Datagrid component, when applying sorting
   * on null values. Sanitize empty values to ensure consistent sorting functionality.
   */
  const accesses =
    data?.results?.map((access) => ({
      ...access,
      localizedRole: translatedRoles[access.role],
      email: access.user.email,
    })) || [];

  useEffect(() => {
    setPagesCount(data?.count ? Math.ceil(data.count / pageSize) : 0);
  }, [data?.count, pageSize, setPagesCount]);

  return (
    <Card
      $padding={{ bottom: 'small' }}
      $margin={{ all: 'big', top: 'none' }}
      $overflow="auto"
      $css={`
          & table td:last-child {
            text-align: right;
          }
      `}
      aria-label={t('List members card')}
    >
      {error && <TextErrors causes={error.cause} />}

      <DataGrid
        columns={[
          {
            field: 'email',
            headerName: t('Emails'),
          },
          {
            field: 'localizedRole',
            headerName: t('Roles'),
            size: 200,
          },
          {
            id: 'column-actions',
            size: 125,
            renderCell: ({ row }) => {
              return (
                <MemberAction
                  doc={doc}
                  access={row}
                  currentRole={currentDocRole(doc)}
                />
              );
            },
          },
        ]}
        rows={accesses}
        isLoading={isLoading}
        pagination={pagination}
        onSortModelChange={setSortModel}
        sortModel={sortModel}
      />
    </Card>
  );
};
