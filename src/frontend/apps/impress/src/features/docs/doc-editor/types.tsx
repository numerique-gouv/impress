import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core';

import { Alert } from '@/features/docs/doc-editor/components/custom-blocks/alert/AlertBlock';

export interface DocAttachment {
  file: string;
}

export type HeadingBlock = {
  id: string;
  type: string;
  text: string;
  content: HeadingBlock[];
  contentText: string;
  props: {
    level: number;
  };
};

export const blockNoteSchema = BlockNoteSchema.create({
  blockSpecs: {
    // Adds all default blocks.
    ...defaultBlockSpecs,
    // Adds the Alert block.
    alert: Alert,
  },
});

export type DocsEditor = typeof blockNoteSchema.BlockNoteEditor;
