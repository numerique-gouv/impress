import { useTranslation } from 'react-i18next';

import { LinkReach, Role } from '../types';

export const useTrans = () => {
  const { t } = useTranslation();

  const translatedRoles = {
    [Role.ADMIN]: t('Administrator'),
    [Role.READER]: t('Reader'),
    [Role.OWNER]: t('Owner'),
    [Role.EDITOR]: t('Editor'),
  };

  const translatedLinkReach = {
    [LinkReach.RESTRICTED]: {
      label: t('Restricted'),
      help: t('Only for people with access'),
    },
    [LinkReach.AUTHENTICATED]: {
      label: t('Authenticated'),
      help: t('Only for authenticated users'),
    },
    [LinkReach.PUBLIC]: {
      label: t('Public'),
      help: t('Anyone on the internet with the link can view'),
    },
  };

  return {
    transRole: (role: Role) => {
      return translatedRoles[role];
    },
    transLinkReach: (linkReach: LinkReach) => {
      return translatedLinkReach[linkReach];
    },
    untitledDocument: t('Untitled document'),
  };
};
