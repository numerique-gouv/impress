import { Alert, VariantType } from '@openfun/cunningham-react';
import React from 'react';

import { Box, Card } from '@/components';
import { DocHeader } from '@/features/docs/doc-header';
import { Doc } from '@/features/docs/doc-management';

import { BlockNoteEditor } from './BlockNoteEditor';

interface DocEditorProps {
  doc: Doc;
}

export const DocEditor = ({ doc }: DocEditorProps) => {
  return (
    <>
      <DocHeader doc={doc} />
      {!doc.abilities.partial_update && (
        <Box $margin={{ all: 'small', top: 'none' }}>
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
