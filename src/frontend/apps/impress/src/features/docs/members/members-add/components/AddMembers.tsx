import {
  Button,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { APIError } from '@/api';
import { Box, Card, IconBG } from '@/components';
import { Doc, Role } from '@/features/docs/doc-management';

import { useCreateDocAccess, useCreateInvitation } from '../api';
import {
  OptionInvitation,
  OptionNewMember,
  OptionSelect,
  OptionType,
  isOptionNewMember,
} from '../types';

import { ChooseRole } from './ChooseRole';
import { OptionsSelect, SearchUsers } from './SearchUsers';

type APIErrorUser = APIError<{
  value: string;
  type: OptionType;
}>;

interface ModalAddMembersProps {
  currentRole: Role;
  doc: Doc;
}

export const AddMembers = ({ currentRole, doc }: ModalAddMembersProps) => {
  const { t } = useTranslation();
  const [selectedUsers, setSelectedUsers] = useState<OptionsSelect>([]);
  const [selectedRole, setSelectedRole] = useState<Role>();
  const { toast } = useToastProvider();
  const { mutateAsync: createInvitation } = useCreateInvitation();
  const { mutateAsync: createDocAccess } = useCreateDocAccess();
  const [resetKey, setResetKey] = useState(1);

  const [isPending, setIsPending] = useState<boolean>(false);

  const switchActions = (selectedUsers: OptionsSelect, selectedRole: Role) =>
    selectedUsers.map(async (selectedUser) => {
      switch (selectedUser.type) {
        case OptionType.INVITATION:
          await createInvitation({
            email: selectedUser.value.email,
            role: selectedRole,
            docId: doc.id,
          });
          break;

        case OptionType.NEW_MEMBER:
          await createDocAccess({
            role: selectedRole,
            docId: doc.id,
            memberId: selectedUser.value.id,
          });
          break;
      }

      return selectedUser;
    });

  const toastOptions = {
    duration: 4000,
  };

  const onError = (dataError: APIErrorUser) => {
    let messageError =
      dataError['data']?.type === OptionType.INVITATION
        ? t(`Failed to create the invitation for {{email}}.`, {
            email: dataError['data']?.value,
          })
        : t(`Failed to add the member in the document.`);

    if (
      dataError.cause?.[0] ===
      'Document invitation with this Email address and Document already exists.'
    ) {
      messageError = t('"{{email}}" is already invited to the document.', {
        email: dataError['data']?.value,
      });
    }

    toast(messageError, VariantType.ERROR, toastOptions);
  };

  const onSuccess = (option: OptionSelect) => {
    const message = !isOptionNewMember(option)
      ? t('Invitation sent to {{email}}.', {
          email: option.value.email,
        })
      : t('User {{email}} added to the document.', {
          email: option.value.email,
        });

    toast(message, VariantType.SUCCESS, toastOptions);
  };

  const handleValidate = async () => {
    setIsPending(true);

    if (!selectedRole) {
      return;
    }

    const settledPromises = await Promise.allSettled<
      OptionInvitation | OptionNewMember
    >(switchActions(selectedUsers, selectedRole));

    setIsPending(false);
    setResetKey(resetKey + 1);
    setSelectedUsers([]);

    settledPromises.forEach((settledPromise) => {
      switch (settledPromise.status) {
        case 'rejected':
          onError(settledPromise.reason as APIErrorUser);
          break;

        case 'fulfilled':
          onSuccess(settledPromise.value);
          break;
      }
    });
  };

  return (
    <Card
      $gap="1rem"
      $padding="1rem"
      $margin="tiny"
      $direction="row"
      $align="center"
      $wrap="wrap"
    >
      <IconBG iconName="group_add" />
      <Box $gap="0.7rem" $direction="row" $wrap="wrap" $css="flex: 70%;">
        <Box $gap="0.7rem" $direction="row" $wrap="wrap" $css="flex: 80%;">
          <Box $css="flex: auto;" $width="15rem">
            <SearchUsers
              key={resetKey + 1}
              doc={doc}
              setSelectedUsers={setSelectedUsers}
              selectedUsers={selectedUsers}
              disabled={isPending}
            />
          </Box>
          <Box $css="flex: auto;">
            <ChooseRole
              key={resetKey}
              currentRole={currentRole}
              disabled={isPending}
              setRole={setSelectedRole}
            />
          </Box>
        </Box>
        <Box $align="center" $justify="center" $css="flex: auto;">
          <Button
            color="primary"
            disabled={!selectedUsers.length || isPending || !selectedRole}
            onClick={() => void handleValidate()}
            style={{ height: '100%', maxHeight: '55px' }}
          >
            {t('Validate')}
          </Button>
        </Box>
      </Box>
    </Card>
  );
};
