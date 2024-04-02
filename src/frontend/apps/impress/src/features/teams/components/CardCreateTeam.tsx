import { Button } from '@openfun/cunningham-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import IconGroup from '@/assets/icons/icon-group2.svg';
import { Box, Card, StyledLink, Text } from '@/components';
import { useCunninghamTheme } from '@/cunningham';

import { useCreateTeam } from '../api';

import { InputTeamName } from './InputTeamName';

export const CardCreateTeam = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    mutate: createTeam,
    isError,
    isPending,
    error,
  } = useCreateTeam({
    onSuccess: (team) => {
      router.push(`/teams/${team.id}`);
    },
  });
  const [teamName, setTeamName] = useState('');
  const { colorsTokens } = useCunninghamTheme();

  return (
    <Card
      className="p-b"
      $height="70%"
      $justify="space-between"
      $width="100%"
      $maxWidth="24rem"
      $minWidth="22rem"
      aria-label={t('Create new team card')}
    >
      <Box $gap="1rem">
        <Box $align="center">
          <IconGroup
            width={44}
            color={colorsTokens()['primary-text']}
            aria-label={t('icon group')}
          />
          <Text as="h3" $textAlign="center">
            {t('Name the team')}
          </Text>
        </Box>
        <InputTeamName
          label={t('Team name')}
          {...{ error, isError, isPending, setTeamName }}
        />
      </Box>
      <Box $justify="space-between" $direction="row" $align="center">
        <StyledLink href="/">
          <Button color="secondary">{t('Cancel')}</Button>
        </StyledLink>
        <Button onClick={() => createTeam(teamName)} disabled={!teamName}>
          {t('Create the team')}
        </Button>
      </Box>
    </Card>
  );
};
