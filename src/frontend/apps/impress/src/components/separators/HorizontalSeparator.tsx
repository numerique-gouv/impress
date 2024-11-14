import { useCunninghamTheme } from '@/cunningham';

import { Box } from '../Box';

export enum SeparatorVariant {
  LIGHT = 'light',
  DARK = 'dark',
}

type Props = {
  variant?: SeparatorVariant;
};

export const HorizontalSeparator = ({
  variant = SeparatorVariant.LIGHT,
}: Props) => {
  const { colorsTokens, themeTokens } = useCunninghamTheme();
  const colors = colorsTokens();
  const spacings = themeTokens().spacings;
  return (
    <Box
      $css={`
        width: 100%;
        height: 1px;
        margin: ${spacings?.['300W'] ?? '0.5rem'} 0 ;
        background-color: ${
          variant === SeparatorVariant.LIGHT
            ? colors['greyscale-200']
            : colors['greyscale-800']
        };
  `}
    />
  );
};
