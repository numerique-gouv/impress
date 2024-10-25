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

type BasicBlock = {
  type: string;
  content: string;
};
export const blocksToYDoc = (blocks: BasicBlock[], doc: Y.Doc) => {
  const xmlFragment = doc.getXmlFragment('document-store');

  blocks.forEach((block) => {
    const xmlElement = new Y.XmlElement(block.type);
    if (block.content) {
      xmlElement.insert(0, [new Y.XmlText(block.content)]);
    }

    xmlFragment.push([xmlElement]);
  });
};
