import { Button } from '@openfun/cunningham-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box, DropButton, Text } from '@/components';
import { useAuthStore } from '@/core/auth';

export const AccountDropdown = () => {
  const { t } = useTranslation();
  const { logout } = useAuthStore();

  return (
    <DropButton
      aria-label={t('My account')}
      button={
        <Box $flex $direction="row" $align="center">
          <Text $theme="primary">{t('My account')}</Text>
          <Text className="material-icons" $theme="primary">
            arrow_drop_down
          </Text>
        </Box>
      }
    >
      <Button
        onClick={logout}
        color="primary-text"
        icon={<span className="material-icons">logout</span>}
        aria-label={t('Logout')}
      >
        <Text $weight="normal">{t('Logout')}</Text>
      </Button>
    </DropButton>
  );
};
