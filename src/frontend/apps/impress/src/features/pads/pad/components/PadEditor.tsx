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
        className="ml-b"
        $align="center"
        $justify="space-between"
      >
        <Text as="h2" $align="center">
          {pad.title}
        </Text>
        <PadToolBox pad={pad} />
      </Box>
      <Card className="m-b p-b" $css="margin-top:0;flex:1;" $overflow="auto">
        <BlockNoteEditor pad={pad} />
      </Card>
    </>
  );
};
