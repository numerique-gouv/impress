import React from 'react';

import { Box } from '@/components';
import { Pad } from '@/features/pads/pad';

import PrintToPDFButton from './PrintToPDFButton';

interface PadToolBoxProps {
  pad: Pad;
}

export const PadToolBox = ({ pad }: PadToolBoxProps) => {
  return (
    <Box className="m-b" $align="flex-end">
      <PrintToPDFButton pad={pad} />
    </Box>
  );
};
