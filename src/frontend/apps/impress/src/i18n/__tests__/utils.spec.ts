import { LANGUAGE_LOCAL_STORAGE } from '../conf';
import { getLanguage, splitLocaleCode } from '../utils';

describe('i18n utils', () => {
  afterEach(() => {
    localStorage.removeItem(LANGUAGE_LOCAL_STORAGE);
  });

  it('checks language code is correctly splitted', () => {
    expect(splitLocaleCode('fr_FR')).toEqual({ language: 'fr', region: 'FR' });
    expect(splitLocaleCode('en_US')).toEqual({ language: 'en', region: 'US' });
    expect(splitLocaleCode('en')).toEqual({
      language: 'en',
      region: undefined,
    });
    expect(splitLocaleCode('fr-FR')).toEqual({ language: 'fr', region: 'FR' });
    expect(splitLocaleCode('en-US')).toEqual({ language: 'en', region: 'US' });
  });

  it('checks that we get expected language from local storage', () => {
    localStorage.setItem(LANGUAGE_LOCAL_STORAGE, 'fr_FR');
    expect(getLanguage()).toEqual('fr');
    localStorage.removeItem(LANGUAGE_LOCAL_STORAGE);

    localStorage.setItem(LANGUAGE_LOCAL_STORAGE, 'en_FR');
    expect(getLanguage()).toEqual('en');

    localStorage.setItem(LANGUAGE_LOCAL_STORAGE, 'xx_XX');
    expect(getLanguage()).toEqual('fr');
  });

  it('checks that we get expected language from browser', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'fr',
      writable: false,
      configurable: true,
    });

    expect(getLanguage()).toEqual('fr');

    Object.defineProperty(navigator, 'language', {
      value: 'en',
      writable: false,
      configurable: true,
    });
    expect(getLanguage()).toEqual('en');

    Object.defineProperty(navigator, 'language', {
      value: 'xx',
      writable: false,
      configurable: true,
    });
    expect(getLanguage()).toEqual('fr');
  });
});
