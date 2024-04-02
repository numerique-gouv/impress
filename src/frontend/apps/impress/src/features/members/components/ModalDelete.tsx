import {
  Button,
  Modal,
  ModalSize,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { t } from 'i18next';
import { useRouter } from 'next/navigation';

import IconUser from '@/assets/icons/icon-user.svg';
import { Box, Text, TextErrors } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { Role, Team } from '@/features/teams/';

import { useDeleteTeamAccess } from '../api/useDeleteTeamAccess';
import IconRemoveMember from '../assets/icon-remove-member.svg';
import { useWhoAmI } from '../hooks/useWhoAmI';
import { Access } from '../types';

interface ModalDeleteProps {
  access: Access;
  currentRole: Role;
  onClose: () => void;
  team: Team;
}

export const ModalDelete = ({ access, onClose, team }: ModalDeleteProps) => {
  const { toast } = useToastProvider();
  const { colorsTokens } = useCunninghamTheme();
  const router = useRouter();

  const { isMyself, isLastOwner, isOtherOwner } = useWhoAmI(access);
  const isNotAllowed = isOtherOwner || isLastOwner;

  const {
    mutate: removeTeamAccess,
    error: errorUpdate,
    isError: isErrorUpdate,
  } = useDeleteTeamAccess({
    onSuccess: () => {
      toast(
        t('The member has been removed from the team'),
        VariantType.SUCCESS,
        {
          duration: 4000,
        },
      );

      // If we remove ourselves, we redirect to the home page
      // because we are no longer part of the team
      isMyself ? router.push('/') : onClose();
    },
  });

  return (
    <Modal
      isOpen
      closeOnClickOutside
      hideCloseButton
      leftActions={
        <Button color="secondary" fullWidth onClick={() => onClose()}>
          {t('Cancel')}
        </Button>
      }
      onClose={onClose}
      rightActions={
        <Button
          color="primary"
          fullWidth
          onClick={() => {
            removeTeamAccess({
              teamId: team.id,
              accessId: access.id,
            });
          }}
          disabled={isNotAllowed}
        >
          {t('Validate')}
        </Button>
      }
      size={ModalSize.MEDIUM}
      title={
        <Box $align="center" $gap="1rem">
          <IconRemoveMember width={48} color={colorsTokens()['primary-text']} />
          <Text $size="h3" className="m-0">
            {t('Remove the member')}
          </Text>
        </Box>
      }
    >
      <Box aria-label={t('Radio buttons to update the roles')}>
        <Text>
          {t(
            'Are you sure you want to remove this member from the {{team}} group?',
            { team: team.name },
          )}
        </Text>

        {isErrorUpdate && (
          <TextErrors className="mb-s" causes={errorUpdate.cause} />
        )}

        {(isLastOwner || isOtherOwner) && (
          <Text
            $theme="warning"
            $direction="row"
            $align="center"
            $gap="0.5rem"
            className="m-t"
            $justify="center"
          >
            <span className="material-icons">warning</span>
            {isLastOwner &&
              t(
                'You are the last owner, you cannot be removed from your team.',
              )}
            {isOtherOwner && t('You cannot remove other owner.')}
          </Text>
        )}

        <Text
          as="p"
          className="p-b"
          $direction="row"
          $gap="0.5rem"
          $background={colorsTokens()['primary-150']}
          $theme="primary"
        >
          <IconUser width={20} height={20} />
          <Text>{access.user.name}</Text>
        </Text>
      </Box>
    </Modal>
  );
};
