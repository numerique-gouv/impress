import { VariantType, useToastProvider } from '@openfun/cunningham-react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  DropdownMenu,
  DropdownMenuOption,
  IconOptions,
} from '@/components';
import {
  useDeleteDocAccess,
  useUpdateDocAccess,
} from '@/features/docs/members/members-list';
import { useWhoAmI } from '@/features/docs/members/members-list/hooks/useWhoAmI';
import { SearchUserRow } from '@/features/users/components/SearchUserRow';

import { Access, Doc, Role } from '../../types';
import { DocRoleDropdown } from '../DocRoleDropdown';

type Props = {
  doc: Doc;
  access: Access;
};
export const DocShareMemberItem = ({ doc, access }: Props) => {
  const { t } = useTranslation();
  const { isLastOwner, isOtherOwner } = useWhoAmI(access);
  const { toast } = useToastProvider();
  const isNotAllowed =
    isOtherOwner || isLastOwner || !doc.abilities.accesses_manage;

  const { mutate: updateDocAccess } = useUpdateDocAccess({
    onError: () => {
      toast(t('Error during invitation update'), VariantType.ERROR, {
        duration: 4000,
      });
    },
  });

  const { mutate: removeDocAccess } = useDeleteDocAccess({
    onError: () => {
      toast(t('Error while deleting invitation'), VariantType.ERROR, {
        duration: 4000,
      });
    },
  });

  const onUpdate = (newRole: Role) => {
    updateDocAccess({
      docId: doc.id,
      role: newRole,
      accessId: access.id,
    });
  };

  const onRemove = () => {
    removeDocAccess({ accessId: access.id, docId: doc.id });
  };

  const moreActions: DropdownMenuOption[] = [
    {
      label: t('Delete'),
      icon: 'delete',
      callback: onRemove,
      disabled: isNotAllowed,
    },
  ];
  return (
    <SearchUserRow
      showRightOnHover={false}
      user={access.user}
      right={
        <Box $direction="row" $align="center">
          <DocRoleDropdown
            currentRole={access.role}
            onSelectRole={onUpdate}
            canUpdate={!isNotAllowed}
          />

          <DropdownMenu options={moreActions}>
            <IconOptions $variation="600" />
          </DropdownMenu>
        </Box>
      }
    />
  );
};
