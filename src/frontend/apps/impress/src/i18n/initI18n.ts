import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import { BASE_LANGUAGE, LANGUAGES_ALLOWED, LANGUAGE_COOKIE_NAME } from './conf';
import resources from './translations.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: BASE_LANGUAGE,
    supportedLngs: Object.keys(LANGUAGES_ALLOWED),
    detection: {
      order: ['cookie', 'navigator'], // detection order
      caches: ['cookie'], // Use cookies to store the language preference
      lookupCookie: LANGUAGE_COOKIE_NAME,
      cookieMinutes: 525600, // Expires after one year
    },
    interpolation: {
      escapeValue: false,
    },
    preload: Object.keys(LANGUAGES_ALLOWED),
    nsSeparator: false,
    keySeparator: false,
  })
  .catch(() => {
    throw new Error('i18n initialization failed');
  });

export default i18n;
