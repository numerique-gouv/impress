import { PropsWithChildren } from 'react';

import { useCunninghamTheme } from '@/cunningham';

import { Box, BoxType } from '.';

export const Card = ({
  children,
  $css,
  ...props
}: PropsWithChildren<BoxType>) => {
  const { colorsTokens, componentTokens } = useCunninghamTheme();

  return (
    <Box
      $background="var(--c--components--header--background)"
      $radius="4px"
      $css={`
        box-shadow: 2px 2px 5px ${componentTokens()['card']['box-shadow']};
        border: 1px solid ${colorsTokens()['card-border']};
        ${$css}
      `}
      {...props}
    >
      {children}
    </Box>
  );
};
