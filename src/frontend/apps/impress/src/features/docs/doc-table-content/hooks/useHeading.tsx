import { useCallback, useState } from 'react';

import { useDocStore } from '../../doc-editor';
import { HeadingBlock } from '../types';

const recursiveTextContent = (content: HeadingBlock['content']): string => {
  if (!content) {
    return '';
  }

  return content.reduce((acc, content) => {
    if (content.type === 'text') {
      return acc + content.text;
    } else if (content.type === 'link') {
      return acc + recursiveTextContent(content.content);
    }

    return acc;
  }, '');
};

export const useHeading = (docId: string) => {
  const { docsStore } = useDocStore();
  const editor = docsStore?.[docId]?.editor;

  const headingFiltering = useCallback(
    () =>
      editor?.document
        .filter((block) => block.type === 'heading')
        .map((block) => ({
          ...block,
          contentText: recursiveTextContent(
            block.content as unknown as HeadingBlock['content'],
          ),
        })) as unknown as HeadingBlock[],
    [editor?.document],
  );

  const [headings, setHeadings] = useState<HeadingBlock[]>(headingFiltering());

  editor?.onEditorContentChange(() => {
    setHeadings(headingFiltering());
  });

  return headings;
};
