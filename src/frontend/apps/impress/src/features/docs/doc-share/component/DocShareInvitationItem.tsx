import { VariantType, useToastProvider } from '@openfun/cunningham-react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  DropdownMenu,
  DropdownMenuOption,
  IconOptions,
} from '@/components';
import { User } from '@/core';
import { Doc, Role } from '@/features/docs/doc-management';
import { SearchUserRow } from '@/features/docs/doc-share/component/SearchUserRow';
import {
  useDeleteDocInvitation,
  useUpdateDocInvitation,
} from '@/features/docs/members/invitation-list';
import { Invitation } from '@/features/docs/members/invitation-list/types';

import { DocRoleDropdown } from './DocRoleDropdown';

type Props = {
  doc: Doc;
  invitation: Invitation;
};
export const DocShareInvitationItem = ({ doc, invitation }: Props) => {
  const { t } = useTranslation();
  const fakeUser: User = {
    id: invitation.email,
    full_name: invitation.email,
    email: invitation.email,
    short_name: invitation.email,
  };

  const { toast } = useToastProvider();
  const canUpdate = doc.abilities.accesses_manage;

  const { mutate: updateDocInvitation } = useUpdateDocInvitation({
    onError: (error) => {
      toast(
        error?.data?.role?.[0] ?? t('Error during update invitation'),
        VariantType.ERROR,
        {
          duration: 4000,
        },
      );
    },
  });

  const { mutate: removeDocInvitation } = useDeleteDocInvitation({
    onError: (error) => {
      toast(
        error?.data?.role?.[0] ?? t('Error during delete invitation'),
        VariantType.ERROR,
        {
          duration: 4000,
        },
      );
    },
  });

  const onUpdate = (newRole: Role) => {
    updateDocInvitation({
      docId: doc.id,
      role: newRole,
      invitationId: invitation.id,
    });
  };

  const onRemove = () => {
    removeDocInvitation({ invitationId: invitation.id, docId: doc.id });
  };

  const moreActions: DropdownMenuOption[] = [
    {
      label: t('Delete'),
      icon: 'delete',
      callback: onRemove,
      disabled: !canUpdate,
    },
  ];
  return (
    <Box
      $width="100%"
      data-testid={`doc-share-invitation-row-${invitation.email}`}
    >
      <SearchUserRow
        alwaysShowRight={true}
        user={fakeUser}
        right={
          <Box $direction="row" $align="center">
            <DocRoleDropdown
              currentRole={invitation.role}
              onSelectRole={onUpdate}
              canUpdate={canUpdate}
            />

            {canUpdate && (
              <DropdownMenu
                data-testid="doc-share-invitation-more-actions"
                options={moreActions}
              >
                <IconOptions $variation="600" />
              </DropdownMenu>
            )}
          </Box>
        }
      />
    </Box>
  );
};
