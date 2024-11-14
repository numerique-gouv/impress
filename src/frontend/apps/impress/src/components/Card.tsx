import { PropsWithChildren } from 'react';

import { useCunninghamTheme } from '@/cunningham';

import { Box, BoxType } from '.';

export const Card = ({
  children,
  $css,
  ...props
}: PropsWithChildren<BoxType>) => {
  const { colorsTokens } = useCunninghamTheme();

  return (
    <Box
      $background="white"
      $radius="4px"
      $css={`
      
        border: 1px solid ${colorsTokens()['card-border']};
        ${$css}
      `}
      {...props}
    >
      {children}
    </Box>
  );
};
