import { DateTime, DateTimeFormatOptions } from 'luxon';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import IconGroup from '@/assets/icons/icon-group2.svg';
import { Box, Card, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';

import { Role, Team } from '../types';

import { ModalUpdateTeam } from './ModalUpdateTeam';
import { TeamActions } from './TeamActions';

const format: DateTimeFormatOptions = {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
};

interface TeamInfoProps {
  team: Team;
  currentRole: Role;
}

export const TeamInfo = ({ team, currentRole }: TeamInfoProps) => {
  const { t } = useTranslation();
  const { colorsTokens } = useCunninghamTheme();
  const { i18n } = useTranslation();
  const [isModalUpdateOpen, setIsModalUpdateOpen] = useState(false);

  const created_at = DateTime.fromISO(team.created_at)
    .setLocale(i18n.language)
    .toLocaleString(format);

  const updated_at = DateTime.fromISO(team.updated_at)
    .setLocale(i18n.language)
    .toLocaleString(format);

  return (
    <>
      <Card className="m-b" style={{ paddingBottom: 0 }}>
        <Box $css="align-self: flex-end;" className="m-t" $position="absolute">
          <TeamActions currentRole={currentRole} team={team} />
        </Box>
        <Box className="m-b" $direction="row" $align="center" $gap="1.5rem">
          <IconGroup
            width={44}
            color={colorsTokens()['primary-text']}
            aria-label={t('icon group')}
            style={{
              flexShrink: 0,
              alignSelf: 'start',
            }}
          />
          <Box>
            <Text as="h3" $weight="bold" $size="1.25rem" className="mt-0">
              {t('Members of “{{teamName}}“', {
                teamName: team.name,
              })}
            </Text>
            <Text $size="m">
              {t('Add people to the “{{teamName}}“ group.', {
                teamName: team.name,
              })}
            </Text>
          </Box>
        </Box>
        <Box
          className="p-s"
          $gap="3rem"
          $direction="row"
          $justify="start"
          $css={`
            border-top: 1px solid ${colorsTokens()['card-border']};
            padding-left: 1.5rem;
          `}
        >
          <Text $size="s" as="p">
            {t('{{count}} member', { count: team.accesses.length })}
          </Text>
          <Text $size="s" $display="inline" as="p">
            {t('Created at')}&nbsp;
            <Text $weight="bold" $display="inline">
              {created_at}
            </Text>
          </Text>
          <Text $size="s" $display="inline" as="p">
            {t('Last update at')}&nbsp;
            <Text $weight="bold" $display="inline">
              {updated_at}
            </Text>
          </Text>
        </Box>
      </Card>
      {isModalUpdateOpen && (
        <ModalUpdateTeam
          onClose={() => setIsModalUpdateOpen(false)}
          team={team}
        />
      )}
    </>
  );
};
