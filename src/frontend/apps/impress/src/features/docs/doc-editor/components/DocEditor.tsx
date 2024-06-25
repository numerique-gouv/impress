import { Alert, VariantType } from '@openfun/cunningham-react';
import React from 'react';

import { Box, Card, Text } from '@/components';
import { Doc } from '@/features/docs/doc-management';
import { DocToolBox } from '@/features/docs/doc-tools';

import { BlockNoteEditor } from './BlockNoteEditor';

interface DocEditorProps {
  doc: Doc;
}

export const DocEditor = ({ doc }: DocEditorProps) => {
  return (
    <>
      <Box
        $direction="row"
        $margin={{ all: 'big', right: 'none' }}
        $align="center"
        $position="relative"
      >
        <Text as="h2" $align="center" $margin="auto">
          {doc.title}
        </Text>
        <DocToolBox doc={doc} />
      </Box>
      {!doc.abilities.partial_update && (
        <Box className="m-b" $css="margin-top:0;">
          <Alert
            type={VariantType.WARNING}
          >{`Read only, you don't have the right to update this document.`}</Alert>
        </Box>
      )}
      <Card
        $margin={{ all: 'big', top: 'none' }}
        $padding="big"
        $css="flex:1;"
        $overflow="auto"
      >
        <BlockNoteEditor doc={doc} />
      </Card>
    </>
  );
};
