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
import { Access, Pad, Role } from '@/features/pads/pad-management';

import { useDeleteDocAccess } from '../api';
import IconRemoveMember from '../assets/icon-remove-member.svg';
import { useWhoAmI } from '../hooks/useWhoAmI';

interface ModalDeleteProps {
  access: Access;
  currentRole: Role;
  onClose: () => void;
  doc: Pad;
}

export const ModalDelete = ({ access, onClose, doc }: ModalDeleteProps) => {
  const { toast } = useToastProvider();
  const { colorsTokens } = useCunninghamTheme();
  const router = useRouter();

  const { isMyself, isLastOwner, isOtherOwner } = useWhoAmI(access);
  const isNotAllowed = isOtherOwner || isLastOwner;

  const {
    mutate: removeDocAccess,
    error: errorUpdate,
    isError: isErrorUpdate,
  } = useDeleteDocAccess({
    onSuccess: () => {
      toast(
        t('The member has been removed from the document'),
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
            removeDocAccess({
              docId: doc.id,
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
          <Text $size="h3" $margin="none">
            {t('Remove the member')}
          </Text>
        </Box>
      }
    >
      <Box aria-label={t('Radio buttons to update the roles')}>
        <Text>
          {t('Are you sure you want to remove this member from the document?')}
        </Text>

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
            $margin="tiny"
            $justify="center"
          >
            <span className="material-icons">warning</span>
            {isLastOwner &&
              t(
                'You are the last owner, you cannot be removed from your document.',
              )}
            {isOtherOwner && t('You cannot remove other owner.')}
          </Text>
        )}

        <Text
          as="p"
          $padding="big"
          $direction="row"
          $gap="0.5rem"
          $background={colorsTokens()['primary-150']}
          $theme="primary"
        >
          <IconUser width={20} height={20} />
          <Text>{access.user.email}</Text>
        </Text>
      </Box>
    </Modal>
  );
};
