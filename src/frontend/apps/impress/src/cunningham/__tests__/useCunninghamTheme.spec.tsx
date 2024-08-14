import useCunninghamTheme from '../useCunninghamTheme';

describe('<useCunninghamTheme />', () => {
  it('has the theme from NEXT_PUBLIC_THEME', () => {
    const { theme } = useCunninghamTheme.getState();

    expect(theme).toBe('test-theme');
  });

  it('has the dsfr logo correctly set', () => {
    const { themeTokens, setTheme } = useCunninghamTheme.getState();
    setTheme('dsfr');
    const logo = themeTokens().logo;
    expect(logo?.src).toBe('/assets/logo-gouv.svg');
    expect(logo?.widthHeader).toBe('110px');
    expect(logo?.widthFooter).toBe('220px');
  });
});
