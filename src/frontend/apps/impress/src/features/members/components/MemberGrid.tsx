import {
  Button,
  DataGrid,
  SortModel,
  usePagination,
} from '@openfun/cunningham-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import IconUser from '@/assets/icons/icon-user.svg';
import { Box, Card, TextErrors } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { ModalAddMembers } from '@/features/addMembers';
import { Role, Team } from '@/features/teams';

import { useTeamAccesses } from '../api/';
import { PAGE_SIZE } from '../conf';

import { MemberAction } from './MemberAction';

interface MemberGridProps {
  team: Team;
  currentRole: Role;
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

export const MemberGrid = ({ team, currentRole }: MemberGridProps) => {
  const [isModalMemberOpen, setIsModalMemberOpen] = useState(false);
  const { t } = useTranslation();
  const { colorsTokens } = useCunninghamTheme();
  const pagination = usePagination({
    pageSize: PAGE_SIZE,
  });
  const [sortModel, setSortModel] = useState<SortModel>([]);
  const { page, pageSize, setPagesCount } = pagination;

  const ordering = sortModel.length ? formatSortModel(sortModel[0]) : undefined;

  const { data, isLoading, error } = useTeamAccesses({
    teamId: team.id,
    page,
    ordering,
  });

  const localizedRoles = {
    [Role.ADMIN]: t('Admin'),
    [Role.MEMBER]: t('Member'),
    [Role.OWNER]: t('Owner'),
  };

  /*
   * Bug occurs from the Cunningham Datagrid component, when applying sorting
   * on null values. Sanitize empty values to ensure consistent sorting functionality.
   */
  const accesses =
    data?.results?.map((access) => ({
      ...access,
      localizedRole: localizedRoles[access.role],
      user: {
        ...access.user,
        name: access.user.name || '',
        email: access.user.email || '',
      },
    })) || [];

  useEffect(() => {
    setPagesCount(data?.count ? Math.ceil(data.count / pageSize) : 0);
  }, [data?.count, pageSize, setPagesCount]);

  return (
    <>
      {currentRole !== Role.MEMBER && (
        <Box className="m-b mb-s" $align="flex-end">
          <Button
            aria-label={t('Add members to the team')}
            style={{
              width: 'fit-content',
              minWidth: '8rem',
              justifyContent: 'center',
            }}
            onClick={() => setIsModalMemberOpen(true)}
          >
            {t('Add')}
          </Button>
        </Box>
      )}
      <Card
        className="m-b pb-s"
        $overflow="auto"
        $css={`
          margin-top:0;
          & .c__pagination__goto {
            display: none;
          }
          & table th:first-child, 
          & table td:first-child {
            padding-right: 0;
            width: 3.5rem;
          }
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
              id: 'icon-user',
              renderCell() {
                return (
                  <Box $direction="row" $align="center">
                    <IconUser
                      aria-label={t('Member icon')}
                      width={20}
                      height={20}
                      color={colorsTokens()['primary-600']}
                    />
                  </Box>
                );
              },
            },
            {
              headerName: t('Names'),
              field: 'user.name',
            },
            {
              field: 'user.email',
              headerName: t('Emails'),
            },
            {
              field: 'localizedRole',
              headerName: t('Roles'),
            },
            {
              id: 'column-actions',
              renderCell: ({ row }) => {
                return (
                  <MemberAction
                    team={team}
                    access={row}
                    currentRole={currentRole}
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
      {isModalMemberOpen && (
        <ModalAddMembers
          currentRole={currentRole}
          onClose={() => setIsModalMemberOpen(false)}
          team={team}
        />
      )}
    </>
  );
};
