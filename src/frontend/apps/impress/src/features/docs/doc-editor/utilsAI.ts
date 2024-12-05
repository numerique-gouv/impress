import { Block as CoreBlock } from '@blocknote/core';

type Block = Omit<CoreBlock, 'type'> & {
  tid?: string;
  type: string;
  text?: string;
  content: Block[] | Block;
  children?: Block[] | Block;
};
export type Node = Block[] | Block;

let idCounter = 0;

// Function to generate a unique id
function generateId() {
  return `tid-${idCounter++}`;
}

// Function to add a unique id to each text node
export function addIdToTextNodes(node: Node) {
  if (Array.isArray(node)) {
    node.forEach((child) => addIdToTextNodes(child));
  } else if (typeof node === 'object' && node !== null) {
    if (node.type === 'text') {
      node.tid = generateId();
    }

    // Recursively process content and children
    if (node.content) {
      addIdToTextNodes(node.content);
    }

    if (node.children) {
      addIdToTextNodes(node.children);
    }

    // Handle table content
    if (
      !Array.isArray(node.content) &&
      node.type === 'table' &&
      node.content &&
      node.content.type === 'tableContent'
    ) {
      const tableContent = node.content;
      if (tableContent.rows) {
        tableContent.rows.forEach((row) => {
          if (row.cells) {
            row.cells.forEach((cell) => {
              addIdToTextNodes(cell as unknown as Node);
            });
          }
        });
      }
    }
  }
}

// Function to extract texts with their tids into a flat JSON object
export function extractTextWithId(
  node: Node,
  texts: Record<string, string> = {},
) {
  if (Array.isArray(node)) {
    node.forEach((child) => extractTextWithId(child, texts));
  } else if (typeof node === 'object' && node !== null) {
    if (node.type === 'text' && node.tid) {
      texts[node.tid] = node.text || '';
    }

    // Recursively process content and children
    if (node.content) {
      extractTextWithId(node.content, texts);
    }

    if (node.children) {
      extractTextWithId(node.children, texts);
    }

    // Handle table content
    if (
      !Array.isArray(node.content) &&
      node.type === 'table' &&
      node.content &&
      node.content.type === 'tableContent'
    ) {
      const tableContent = node.content;
      if (tableContent.rows) {
        tableContent.rows.forEach((row) => {
          if (row.cells) {
            row.cells.forEach((cell) => {
              extractTextWithId(cell as unknown as Node, texts);
            });
          }
        });
      }
    }
  }
  return texts;
}

// Function to update the original JSON using a second JSON containing updated texts
export function updateTextsWithId(
  node: Node,
  updatedTexts: Record<string, string>,
) {
  if (Array.isArray(node)) {
    node.forEach((child) => updateTextsWithId(child, updatedTexts));
  } else if (typeof node === 'object' && node !== null) {
    if (
      node.type === 'text' &&
      node.tid &&
      updatedTexts[node.tid] !== undefined
    ) {
      node.text = updatedTexts[node.tid];
    }

    // Recursively process content and children
    if (node.content) {
      updateTextsWithId(node.content, updatedTexts);
    }

    if (node.children) {
      updateTextsWithId(node.children, updatedTexts);
    }

    // Handle table content
    if (
      !Array.isArray(node.content) &&
      node.type === 'table' &&
      node.content &&
      node.content.type === 'tableContent'
    ) {
      const tableContent = node.content;
      if (tableContent.rows) {
        tableContent.rows.forEach((row) => {
          if (row.cells) {
            row.cells.forEach((cell) => {
              updateTextsWithId(cell as unknown as Node, updatedTexts);
            });
          }
        });
      }
    }
  }
}
