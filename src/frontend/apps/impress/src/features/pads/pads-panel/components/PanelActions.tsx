import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box, BoxButton, StyledLink } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { PadsOrdering } from '@/features/pads/pad-management';

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
            ? t('Sort the documents by creation date descendent')
            : t('Sort the documents by creation date ascendent')
        }
        onClick={changeOrdering}
        $radius="100%"
        $background={isSortAsc ? colorsTokens()['primary-200'] : 'transparent'}
        $color={colorsTokens()['primary-600']}
      >
        <IconSort
          width={30}
          height={30}
          aria-label={t('Sort documents icon')}
        />
      </BoxButton>
      <StyledLink href="/docs/create">
        <BoxButton
          aria-label={t('Add a document')}
          $color={colorsTokens()['primary-600']}
        >
          <IconAdd width={30} height={30} aria-label={t('Add document icon')} />
        </BoxButton>
      </StyledLink>
    </Box>
  );
};
