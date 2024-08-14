import { useTranslation } from 'react-i18next';

import { ContentLanguage } from '../types';

export const useLanguage = (): {
  language: string;
  contentLanguage: ContentLanguage;
} => {
  const { i18n } = useTranslation();

  return {
    language: i18n.language,
    contentLanguage: i18n.language === 'fr' ? 'fr-fr' : 'en-us',
  };
};
