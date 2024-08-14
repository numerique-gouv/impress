import useCunninghamTheme from '../useCunninghamTheme';

describe('<useCunninghamTheme />', () => {
  it('has the theme from NEXT_PUBLIC_THEME', () => {
    const { theme } = useCunninghamTheme.getState();

    expect(theme).toBe('test-theme');
  });
});
