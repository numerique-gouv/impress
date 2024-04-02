import {
  Button,
  Modal,
  ModalSize,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { t } from 'i18next';
import { useRouter } from 'next/navigation';

import IconGroup from '@/assets/icons/icon-group.svg';
import { Box, Text, TextErrors } from '@/components';
import useCunninghamTheme from '@/cunningham/useCunninghamTheme';

import { useRemoveTeam } from '../api/useRemoveTeam';
import IconRemove from '../assets/icon-trash.svg';
import { Team } from '../types';

interface ModalRemoveTeamProps {
  onClose: () => void;
  team: Team;
}

export const ModalRemoveTeam = ({ onClose, team }: ModalRemoveTeamProps) => {
  const { colorsTokens } = useCunninghamTheme();
  const { toast } = useToastProvider();
  const router = useRouter();

  const {
    mutate: removeTeam,
    isError,
    error,
  } = useRemoveTeam({
    onSuccess: () => {
      toast(t('The team has been removed.'), VariantType.SUCCESS, {
        duration: 4000,
      });
      router.push('/');
    },
  });

  return (
    <Modal
      isOpen
      closeOnClickOutside
      hideCloseButton
      leftActions={
        <Button
          aria-label={t('Close the modal')}
          color="secondary"
          fullWidth
          onClick={() => onClose()}
        >
          {t('Cancel')}
        </Button>
      }
      onClose={() => onClose()}
      rightActions={
        <Button
          aria-label={t('Confirm deletion')}
          color="primary"
          fullWidth
          onClick={() =>
            removeTeam({
              teamId: team.id,
            })
          }
        >
          {t('Confirm deletion')}
        </Button>
      }
      size={ModalSize.MEDIUM}
      title={
        <Box $align="center" $gap="1rem">
          <IconRemove width={48} color={colorsTokens()['primary-text']} />
          <Text $size="h3" className="m-0">
            {t('Deleting the {{teamName}} team', { teamName: team.name })}
          </Text>
        </Box>
      }
    >
      <Box className="mb-xl" aria-label={t('Content modal to delete the team')}>
        <Text as="p" className="mb-b">
          {t('Are you sure you want to delete {{teamName}} team?', {
            teamName: team.name,
          })}
        </Text>

        {isError && <TextErrors className="mb-s" causes={error.cause} />}

        <Text
          as="p"
          className="p-s"
          $direction="row"
          $gap="0.5rem"
          $background={colorsTokens()['primary-150']}
          $theme="primary"
          $align="center"
          $radius="2px"
        >
          <IconGroup
            className="p-t"
            aria-label={t(`Teams icon`)}
            color={colorsTokens()['primary-500']}
            width={58}
            style={{
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: `1px solid ${colorsTokens()['primary-300']}`,
            }}
          />
          <Text $theme="primary" $weight="bold" $size="l">
            {team.name}
          </Text>
        </Text>
      </Box>
    </Modal>
  );
};
