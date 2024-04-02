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
import { Role } from '@/features/teams';

import { useUpdateTeamAccess } from '../api/useUpdateTeamAccess';
import { useWhoAmI } from '../hooks/useWhoAmI';
import { Access } from '../types';

import { ChooseRole } from './ChooseRole';

interface ModalRoleProps {
  access: Access;
  currentRole: Role;
  onClose: () => void;
  teamId: string;
}

export const ModalRole = ({
  access,
  currentRole,
  onClose,
  teamId,
}: ModalRoleProps) => {
  const { t } = useTranslation();
  const [localRole, setLocalRole] = useState(access.role);
  const { toast } = useToastProvider();
  const {
    mutate: updateTeamAccess,
    error: errorUpdate,
    isError: isErrorUpdate,
  } = useUpdateTeamAccess({
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
        <Button color="secondary" fullWidth onClick={() => onClose()}>
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
            updateTeamAccess({
              role: localRole,
              teamId,
              accessId: access.id,
            });
          }}
          disabled={isNotAllowed}
        >
          {t('Validate')}
        </Button>
      }
      size={ModalSize.MEDIUM}
      title={t('Update the role')}
    >
      <Box aria-label={t('Radio buttons to update the roles')}>
        {isErrorUpdate && (
          <TextErrors className="mb-s" causes={errorUpdate.cause} />
        )}

        {(isLastOwner || isOtherOwner) && (
          <Text
            $theme="warning"
            $direction="row"
            $align="center"
            $gap="0.5rem"
            className="mb-t"
            $justify="center"
          >
            <span className="material-icons">warning</span>
            {isLastOwner &&
              t('You are the last owner, you cannot change your role.')}
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
