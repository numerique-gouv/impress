import { Button } from '@openfun/cunningham-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, DropButton, IconOptions, Text } from '@/components';

import { Role, Team } from '../types';

import { ModalRemoveTeam } from './ModalRemoveTeam';
import { ModalUpdateTeam } from './ModalUpdateTeam';

interface TeamActionsProps {
  currentRole: Role;
  team: Team;
}

export const TeamActions = ({ currentRole, team }: TeamActionsProps) => {
  const { t } = useTranslation();
  const [isModalUpdateOpen, setIsModalUpdateOpen] = useState(false);
  const [isModalRemoveOpen, setIsModalRemoveOpen] = useState(false);
  const [isDropOpen, setIsDropOpen] = useState(false);

  if (currentRole === Role.MEMBER) {
    return null;
  }

  return (
    <>
      <DropButton
        button={
          <IconOptions
            isOpen={isDropOpen}
            aria-label={t('Open the team options')}
          />
        }
        onOpenChange={(isOpen) => setIsDropOpen(isOpen)}
        isOpen={isDropOpen}
      >
        <Box>
          <Button
            onClick={() => {
              setIsModalUpdateOpen(true);
              setIsDropOpen(false);
            }}
            color="primary-text"
            icon={<span className="material-icons">edit</span>}
          >
            <Text $theme="primary">{t('Update the team')}</Text>
          </Button>
          {currentRole === Role.OWNER && (
            <Button
              onClick={() => {
                setIsModalRemoveOpen(true);
                setIsDropOpen(false);
              }}
              color="primary-text"
              icon={<span className="material-icons">delete</span>}
            >
              <Text $theme="primary">{t('Delete the team')}</Text>
            </Button>
          )}
        </Box>
      </DropButton>
      {isModalUpdateOpen && (
        <ModalUpdateTeam
          onClose={() => setIsModalUpdateOpen(false)}
          team={team}
        />
      )}
      {isModalRemoveOpen && (
        <ModalRemoveTeam
          onClose={() => setIsModalRemoveOpen(false)}
          team={team}
        />
      )}
    </>
  );
};
