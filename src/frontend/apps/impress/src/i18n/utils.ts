import {
  BASE_LANGUAGE,
  LANGUAGES_ALLOWED,
  LANGUAGE_LOCAL_STORAGE,
} from './conf';

export const splitLocaleCode = (language: string) => {
  const locale = language.split(/[-_]/);
  return {
    language: locale[0],
    region: locale.length === 2 ? locale[1] : undefined,
  };
};

export const getLanguage = () => {
  if (typeof window === 'undefined') {
    return BASE_LANGUAGE;
  }

  const languageStore =
    localStorage.getItem(LANGUAGE_LOCAL_STORAGE) || navigator?.language;

  const language = splitLocaleCode(languageStore).language;

  return LANGUAGES_ALLOWED.includes(language) ? language : BASE_LANGUAGE;
};
