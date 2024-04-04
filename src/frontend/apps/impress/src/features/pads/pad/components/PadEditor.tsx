import React from 'react';

import { Card, Text } from '@/components';

import { Pad } from '../types';

import { BlockNoteEditor } from './BlockNoteEditor';

interface PadEditorProps {
  pad: Pad;
}

export const PadEditor = ({ pad }: PadEditorProps) => {
  return (
    <Card className="m-b p-b" $height="100%">
      <Text as="h2">{pad.name}</Text>
      <BlockNoteEditor />
    </Card>
  );
};
