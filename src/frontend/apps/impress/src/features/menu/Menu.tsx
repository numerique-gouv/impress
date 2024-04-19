import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@/components/';
import useCunninghamTheme from '@/cunningham/useCunninghamTheme';

import MenuItem from './MenuItems';
import IconPad from './assets/icon-pad.svg';
import IconTemplate from './assets/icon-template.svg';

export const Menu = () => {
  const { colorsTokens } = useCunninghamTheme();
  const { t } = useTranslation();

  return (
    <Box
      as="menu"
      className="m-0 p-0"
      $background={colorsTokens()['primary-800']}
      $height="100%"
      $justify="space-between"
    >
      <Box className="pt-l" $direction="column" $gap="0.8rem">
        <MenuItem Icon={IconPad} label={t('Pad')} href="/" alias={['/pads/']} />
        <MenuItem
          Icon={IconTemplate}
          label={t('Template')}
          href="/templates/"
        />
      </Box>
    </Box>
  );
};
