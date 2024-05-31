import {
  Button,
  Modal,
  ModalSize,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Text, TextErrors } from '@/components';
import { Access, Role } from '@/features/pads/pad-management';

import { ChooseRole } from '../../members-add/components/ChooseRole';
import { useUpdateDocAccess } from '../api';
import { useWhoAmI } from '../hooks/useWhoAmI';

interface ModalRoleProps {
  access: Access;
  currentRole: Role;
  onClose: () => void;
  docId: string;
}

export const ModalRole = ({
  access,
  currentRole,
  onClose,
  docId,
}: ModalRoleProps) => {
  const { t } = useTranslation();
  const [localRole, setLocalRole] = useState(access.role);
  const { toast } = useToastProvider();
  const {
    mutate: updateDocAccess,
    error: errorUpdate,
    isError: isErrorUpdate,
    isPending,
  } = useUpdateDocAccess({
    onSuccess: () => {
      toast(t('The role has been updated'), VariantType.SUCCESS, {
        duration: 4000,
      });
      onClose();
    },
  });
  const { isLastOwner, isOtherOwner } = useWhoAmI(access);

  const isNotAllowed = isOtherOwner || isLastOwner;

  return (
    <Modal
      isOpen
      leftActions={
        <Button
          color="secondary"
          fullWidth
          onClick={() => onClose()}
          disabled={isPending}
        >
          {t('Cancel')}
        </Button>
      }
      onClose={() => onClose()}
      closeOnClickOutside
      hideCloseButton
      rightActions={
        <Button
          color="primary"
          fullWidth
          onClick={() => {
            updateDocAccess({
              role: localRole,
              docId,
              accessId: access.id,
            });
          }}
          disabled={isNotAllowed || isPending}
        >
          {t('Validate')}
        </Button>
      }
      size={ModalSize.MEDIUM}
      title={t('Update the role')}
    >
      <Box aria-label={t('Radio buttons to update the roles')}>
        {isErrorUpdate && (
          <TextErrors
            $margin={{ bottom: 'small' }}
            causes={errorUpdate.cause}
          />
        )}

        {(isLastOwner || isOtherOwner) && (
          <Text
            $theme="warning"
            $direction="row"
            $align="center"
            $gap="0.5rem"
            $margin={{ bottom: 'tiny', top: 'none' }}
            as="div"
          >
            <span className="material-icons">warning</span>
            {isLastOwner && (
              <Box $align="flex-start">
                <Text $theme="warning">
                  {t('You are the sole owner of this group.')}
                </Text>
                <Text $theme="warning">
                  {t(
                    'Make another member the group owner, before you can change your own role.',
                  )}
                </Text>
              </Box>
            )}

            {isOtherOwner && t('You cannot update the role of other owner.')}
          </Text>
        )}

        <ChooseRole
          defaultRole={access.role}
          currentRole={currentRole}
          disabled={isNotAllowed}
          setRole={setLocalRole}
        />
      </Box>
    </Modal>
  );
};
