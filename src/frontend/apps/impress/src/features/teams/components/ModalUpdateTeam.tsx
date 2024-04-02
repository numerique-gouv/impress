import {
  Button,
  Modal,
  ModalSize,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { t } from 'i18next';
import { useState } from 'react';

import { Box, Text } from '@/components';
import useCunninghamTheme from '@/cunningham/useCunninghamTheme';

import { useUpdateTeam } from '../api';
import IconEdit from '../assets/icon-edit.svg';
import { Team } from '../types';

import { InputTeamName } from './InputTeamName';

interface ModalUpdateTeamProps {
  onClose: () => void;
  team: Team;
}

export const ModalUpdateTeam = ({ onClose, team }: ModalUpdateTeamProps) => {
  const { colorsTokens } = useCunninghamTheme();
  const [teamName, setTeamName] = useState(team.name);
  const { toast } = useToastProvider();

  const {
    mutate: updateTeam,
    isError,
    isPending,
    error,
  } = useUpdateTeam({
    onSuccess: () => {
      toast(t('The team has been updated.'), VariantType.SUCCESS, {
        duration: 4000,
      });
      onClose();
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
          aria-label={t('Validate the modification')}
          color="primary"
          fullWidth
          onClick={() =>
            updateTeam({
              name: teamName,
              id: team.id,
            })
          }
        >
          {t('Validate the modification')}
        </Button>
      }
      size={ModalSize.MEDIUM}
      title={
        <Box $align="center" $gap="1rem">
          <IconEdit width={48} color={colorsTokens()['primary-text']} />
          <Text $size="h3" className="m-0">
            {t('Update team {{teamName}}', { teamName: team.name })}
          </Text>
        </Box>
      }
    >
      <Box className="mb-xl" aria-label={t('Content modal to update the team')}>
        <Text as="p" className="mb-b">
          {t('Enter the new name of the selected team')}
        </Text>

        <InputTeamName
          label={t('New name...')}
          defaultValue={team.name}
          {...{ error, isError, isPending, setTeamName }}
        />
      </Box>
    </Modal>
  );
};
