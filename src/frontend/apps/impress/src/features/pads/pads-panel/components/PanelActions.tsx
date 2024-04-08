import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box, BoxButton, StyledLink } from '@/components';
import { useCunninghamTheme } from '@/cunningham';

import { PadsOrdering } from '../api';
import IconAdd from '../assets/icon-add.svg';
import IconSort from '../assets/icon-sort.svg';
import { usePadPanelStore } from '../store';

export const PanelActions = () => {
  const { t } = useTranslation();
  const { changeOrdering, ordering } = usePadPanelStore();
  const { colorsTokens } = useCunninghamTheme();

  const isSortAsc = ordering === PadsOrdering.BY_CREATED_ON;

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
            ? t('Sort the pads by creation date descendent')
            : t('Sort the pads by creation date ascendent')
        }
        onClick={changeOrdering}
        $radius="100%"
        $background={isSortAsc ? colorsTokens()['primary-200'] : 'transparent'}
        $color={colorsTokens()['primary-600']}
      >
        <IconSort width={30} height={30} aria-label={t('Sort pads icon')} />
      </BoxButton>
      <StyledLink href="/pads/create">
        <BoxButton
          aria-label={t('Add a pad')}
          $color={colorsTokens()['primary-600']}
        >
          <IconAdd width={30} height={30} aria-label={t('Add pad icon')} />
        </BoxButton>
      </StyledLink>
    </Box>
  );
};
