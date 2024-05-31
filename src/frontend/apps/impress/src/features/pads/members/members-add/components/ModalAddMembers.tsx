import {
  Button,
  Modal,
  ModalSize,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createGlobalStyle } from 'styled-components';

import { APIError } from '@/api';
import { Box, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { Pad, Role } from '@/features/pads/pad-management';

import { useCreateDocAccess, useCreateInvitation } from '../api';
import IconAddUser from '../assets/add-user.svg';
import {
  OptionInvitation,
  OptionNewMember,
  OptionSelect,
  OptionType,
  isOptionNewMember,
} from '../types';

import { ChooseRole } from './ChooseRole';
import { OptionsSelect, SearchUsers } from './SearchUsers';

const GlobalStyle = createGlobalStyle`
  .c__modal {
    overflow: visible;
  }
`;

type APIErrorUser = APIError<{
  value: string;
  type: OptionType;
}>;

interface ModalAddMembersProps {
  currentRole: Role;
  onClose: () => void;
  doc: Pad;
}

export const ModalAddMembers = ({
  currentRole,
  onClose,
  doc,
}: ModalAddMembersProps) => {
  const { colorsTokens } = useCunninghamTheme();
  const { t } = useTranslation();
  const [selectedUsers, setSelectedUsers] = useState<OptionsSelect>([]);
  const [selectedRole, setSelectedRole] = useState<Role>(Role.READER);
  const { toast } = useToastProvider();
  const { mutateAsync: createInvitation } = useCreateInvitation();
  const { mutateAsync: createDocAccess } = useCreateDocAccess();

  const [isPending, setIsPending] = useState<boolean>(false);

  const switchActions = (selectedUsers: OptionsSelect) =>
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
      : t('User added to the document.');

    toast(message, VariantType.SUCCESS, toastOptions);
  };

  const handleValidate = async () => {
    setIsPending(true);

    const settledPromises = await Promise.allSettled<
      OptionInvitation | OptionNewMember
    >(switchActions(selectedUsers));

    onClose();
    setIsPending(false);

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
    <Modal
      isOpen
      leftActions={
        <Button
          color="secondary"
          fullWidth
          onClick={onClose}
          disabled={isPending}
        >
          {t('Cancel')}
        </Button>
      }
      onClose={onClose}
      closeOnClickOutside
      hideCloseButton
      rightActions={
        <Button
          color="primary"
          fullWidth
          disabled={!selectedUsers.length || isPending}
          onClick={() => void handleValidate()}
        >
          {t('Validate')}
        </Button>
      }
      size={ModalSize.MEDIUM}
      title={
        <Box $align="center" $gap="1rem">
          <IconAddUser width={48} color={colorsTokens()['primary-text']} />
          <Text $size="h3" $margin="none">
            {t('Add members to the document')}
          </Text>
        </Box>
      }
    >
      <GlobalStyle />
      <Box $margin={{ bottom: 'xl', top: 'large' }}>
        <SearchUsers
          doc={doc}
          setSelectedUsers={setSelectedUsers}
          selectedUsers={selectedUsers}
          disabled={isPending}
        />
        {selectedUsers.length >= 0 && (
          <Box $margin={{ top: 'small' }}>
            <Text as="h4" $textAlign="left" $margin={{ bottom: 'tiny' }}>
              {t('Choose a role')}
            </Text>
            <ChooseRole
              currentRole={currentRole}
              disabled={isPending}
              defaultRole={Role.READER}
              setRole={setSelectedRole}
            />
          </Box>
        )}
      </Box>
    </Modal>
  );
};
