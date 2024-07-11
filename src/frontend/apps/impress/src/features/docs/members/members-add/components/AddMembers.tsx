import {
  Button,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { APIError } from '@/api';
import { Box, Card, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
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
  const { colorsTokens } = useCunninghamTheme();
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

  const onError = (dataError: APIErrorUser['data']) => {
    const messageError =
      dataError?.type === OptionType.INVITATION
        ? t(`Failed to create the invitation for {{email}}.`, {
            email: dataError?.value,
          })
        : t(`Failed to add the member in the document.`);

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

    settledPromises.forEach((settledPromise) => {
      switch (settledPromise.status) {
        case 'rejected':
          onError((settledPromise.reason as APIErrorUser).data);
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
      $margin="1rem 0.7rem"
      $direction="row"
      $align="center"
      $wrap="wrap"
    >
      <Text
        $isMaterialIcon
        $size="44px"
        $theme="primary"
        $background={colorsTokens()['primary-bg']}
        $css={`border: 1px solid ${colorsTokens()['primary-200']}`}
        $radius="12px"
        $padding="4px"
        $margin="auto"
      >
        group_add
      </Text>
      <Box $gap="0.7rem" $direction="row" $wrap="wrap" $css="flex: 70%;">
        <Box $gap="0.7rem" $direction="row" $wrap="wrap" $css="flex: 80%;">
          <Box $css="flex: auto;">
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
