import { useTranslation } from 'react-i18next';

import { Role } from '../types';

export const useTransRole = () => {
  const { t } = useTranslation();

  const translatedRoles = {
    [Role.ADMIN]: t('Administrator'),
    [Role.READER]: t('Reader'),
    [Role.OWNER]: t('Owner'),
    [Role.EDITOR]: t('Editor'),
  };

  const transRole = (role: Role) => {
    return translatedRoles[role];
  };

  return transRole;
};
