import {
  Block,
  BlockNoteEditor,
  DefaultBlockSchema,
  DefaultInlineContentSchema,
  DefaultStyleSchema,
  nodeToBlock,
} from '@blocknote/core';
import { Node } from '@tiptap/pm/model';
import { yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror';
import * as Y from 'yjs';

import { Doc, Role } from './types';

export const currentDocRole = (abilities: Doc['abilities']): Role => {
  return abilities.destroy
    ? Role.OWNER
    : abilities.accesses_manage
      ? Role.ADMIN
      : abilities.partial_update
        ? Role.EDITOR
        : Role.READER;
};

export const base64ToYDoc = (base64: string) => {
  const uint8Array = Buffer.from(base64, 'base64');
  const ydoc = new Y.Doc();
  Y.applyUpdate(ydoc, uint8Array);
  return ydoc;
};

export const base64ToBlocknoteXmlFragment = (base64: string) => {
  return base64ToYDoc(base64).getXmlFragment('document-store');
};

export const prosemirrorNodeToBlocks = (
  pmNode: Node,
  editor: BlockNoteEditor,
) => {
  const blocks: Block<
    DefaultBlockSchema,
    DefaultInlineContentSchema,
    DefaultStyleSchema
  >[] = [];

  // note, this code is similar to editor.document
  pmNode.firstChild?.descendants((node) => {
    blocks.push(
      nodeToBlock(
        node,
        editor.schema.blockSchema,
        editor.schema.inlineContentSchema,
        editor.schema.styleSchema,
      ),
    );

    return false;
  });

  return blocks;
};

export const yXmlFragmentToBlocks = (
  xmlFragment: Y.XmlFragment,
  editor: BlockNoteEditor,
) => {
  const pmNode = yXmlFragmentToProseMirrorRootNode(
    xmlFragment,
    editor.pmSchema,
  );
  return prosemirrorNodeToBlocks(pmNode, editor);
};
