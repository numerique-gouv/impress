import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box, BoxButton, StyledLink } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { TeamsOrdering } from '@/features/teams/api/';
import IconAdd from '@/features/teams/assets/icon-add.svg';
import IconSort from '@/features/teams/assets/icon-sort.svg';
import { useTeamStore } from '@/features/teams/store/useTeamsStore';

export const PanelActions = () => {
  const { t } = useTranslation();
  const { changeOrdering, ordering } = useTeamStore();
  const { colorsTokens } = useCunninghamTheme();

  const isSortAsc = ordering === TeamsOrdering.BY_CREATED_ON;

  return (
    <Box
      $direction="row"
      $gap="1rem"
      $css={`
        & button {
          padding: 0;

          svg {
            padding: 0.1rem;
          }
        }
      `}
    >
      <BoxButton
        aria-label={
          isSortAsc
            ? t('Sort the teams by creation date descendent')
            : t('Sort the teams by creation date ascendent')
        }
        onClick={changeOrdering}
        $radius="100%"
        $background={isSortAsc ? colorsTokens()['primary-200'] : 'transparent'}
        $color={colorsTokens()['primary-600']}
      >
        <IconSort width={30} height={30} aria-label={t('Sort teams icon')} />
      </BoxButton>
      <StyledLink href="/teams/create">
        <BoxButton
          aria-label={t('Add a team')}
          $color={colorsTokens()['primary-600']}
        >
          <IconAdd width={30} height={30} aria-label={t('Add team icon')} />
        </BoxButton>
      </StyledLink>
    </Box>
  );
};
