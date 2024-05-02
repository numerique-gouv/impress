import React from 'react';

import { Card, Text } from '@/components';

import { PadToolBox } from '../../pad-tools';
import { Pad } from '../types';

import { BlockNoteEditor } from './BlockNoteEditor';

interface PadEditorProps {
  pad: Pad;
}

export const PadEditor = ({ pad }: PadEditorProps) => {
  return (
    <>
      <PadToolBox pad={pad} />
      <Card
        $margin={{ top: 'none', all: 'big' }}
        $padding="big"
        $css="flex:1;"
        $overflow="auto"
      >
        <Text as="h2" $align="center">
          {pad.title}
        </Text>
        <BlockNoteEditor pad={pad} />
      </Card>
    </>
  );
};
