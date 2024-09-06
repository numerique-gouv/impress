import { Button } from '@openfun/cunningham-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/core/auth';

export const AccountDropdown = () => {
  const { t } = useTranslation();
  const { logout, authenticated, login } = useAuthStore();

  if (!authenticated) {
    return (
      <Button
        onClick={login}
        color="primary-text"
        icon={<span className="material-icons">login</span>}
        aria-label={t('Login')}
      >
        {t('Login')}
      </Button>
    );
  }

  return (
    <Button
      onClick={logout}
      color="primary-text"
      icon={<span className="material-icons">logout</span>}
      aria-label={t('Logout')}
    >
      {t('Logout')}
    </Button>
  );
};
