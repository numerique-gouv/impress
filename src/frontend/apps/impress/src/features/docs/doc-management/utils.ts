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

export const base64ToYDoc = (base64: string) => {
  const uint8Array = Buffer.from(base64, 'base64');
  const ydoc = new Y.Doc();
  Y.applyUpdate(ydoc, uint8Array);
  return ydoc;
};

export const base64ToBlocknoteXmlFragment = (base64: string) => {
  return base64ToYDoc(base64).getXmlFragment('document-store');
};
