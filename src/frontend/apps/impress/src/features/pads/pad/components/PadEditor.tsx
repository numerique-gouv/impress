import React from 'react';

import { Box, Card, Text } from '@/components';
import { PadToolBox } from '@/features/pads/pad-tools';

import { Pad } from '../types';

import { BlockNoteEditor } from './BlockNoteEditor';

interface PadEditorProps {
  pad: Pad;
}

export const PadEditor = ({ pad }: PadEditorProps) => {
  return (
    <>
      <Box
        $direction="row"
        $margin={{ all: 'big', right: 'none' }}
        $align="center"
        $position="relative"
      >
        <Text as="h2" $align="center" $margin="auto">
          {pad.title}
        </Text>
        <PadToolBox pad={pad} />
      </Box>
      <Card
        $margin={{ all: 'big', top: 'none' }}
        $padding="big"
        $css="flex:1;"
        $overflow="auto"
      >
        <BlockNoteEditor pad={pad} />
      </Card>
    </>
  );
};
