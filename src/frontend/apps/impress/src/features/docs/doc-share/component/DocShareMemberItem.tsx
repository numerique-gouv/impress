import { VariantType, useToastProvider } from '@openfun/cunningham-react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  DropdownMenu,
  DropdownMenuOption,
  IconOptions,
} from '@/components';
import { SearchUserRow } from '@/features/docs/doc-share/component/SearchUserRow';
import {
  useDeleteDocAccess,
  useUpdateDocAccess,
} from '@/features/docs/members/members-list';
import { useWhoAmI } from '@/features/docs/members/members-list/hooks/useWhoAmI';
import { useResponsiveStore } from '@/stores';

import { Access, Doc, Role } from '../../doc-management/types';

import { DocRoleDropdown } from './DocRoleDropdown';

type Props = {
  doc: Doc;
  access: Access;
};
export const DocShareMemberItem = ({ doc, access }: Props) => {
  const { t } = useTranslation();
  const { isLastOwner, isOtherOwner } = useWhoAmI(access);
  const { toast } = useToastProvider();
  const { isDesktop } = useResponsiveStore();
  const isNotAllowed =
    isOtherOwner || !!isLastOwner || !doc.abilities.accesses_manage;

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
    <Box
      $width="100%"
      data-testid={`doc-share-member-row-${access.user.email}`}
    >
      <SearchUserRow
        alwaysShowRight={true}
        user={access.user}
        right={
          <Box $direction="row" $align="center">
            <DocRoleDropdown
              currentRole={access.role}
              onSelectRole={onUpdate}
              canUpdate={doc.abilities.accesses_manage}
              isLastOwner={isLastOwner}
              isOtherOwner={!!isOtherOwner}
            />

            {isDesktop && doc.abilities.accesses_manage && (
              <DropdownMenu options={moreActions}>
                <IconOptions
                  data-testid="doc-share-member-more-actions"
                  $variation="600"
                />
              </DropdownMenu>
            )}
          </Box>
        }
      />
    </Box>
  );
};
