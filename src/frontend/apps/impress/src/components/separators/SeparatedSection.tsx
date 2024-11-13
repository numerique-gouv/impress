import { PropsWithChildren } from 'react';

import { useCunninghamTheme } from '@/cunningham';

import { Box } from '../Box';

type Props = {
  showSeparator?: boolean;
};

export const SeparatedSection = ({
  showSeparator = true,
  children,
}: PropsWithChildren<Props>) => {
  const theme = useCunninghamTheme();
  const colors = theme.colorsTokens();
  return (
    <Box
      className="toto"
      $padding={{ vertical: '100V' }}
      $css={`
        padding: 12px 0;
        ${showSeparator ? `border-bottom: 1px solid ${(colors?.['greyscale-200'] as string) ?? '#E5E5E5'};` : ''}
    `}
    >
      {children}
    </Box>
  );
};
