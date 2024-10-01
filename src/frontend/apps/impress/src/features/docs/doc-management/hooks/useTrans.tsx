import { useTranslation } from 'react-i18next';

import { Role } from '../types';

export const useTrans = () => {
  const { t } = useTranslation();

  const translatedRoles = {
    [Role.ADMIN]: t('Administrator'),
    [Role.READER]: t('Reader'),
    [Role.OWNER]: t('Owner'),
    [Role.EDITOR]: t('Editor'),
  };

  return {
    transRole: (role: Role) => {
      return translatedRoles[role];
    },
    untitledDocument: t('Untitled document'),
  };
};
