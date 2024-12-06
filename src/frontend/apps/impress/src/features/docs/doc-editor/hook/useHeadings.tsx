import { BlockNoteEditor } from '@blocknote/core';
import { useEffect } from 'react';

import { useHeadingStore } from '../stores';

export const useHeadings = (editor: BlockNoteEditor) => {
  const { setHeadings, resetHeadings } = useHeadingStore();

  useEffect(() => {
    setHeadings(editor);

    let timeout: NodeJS.Timeout;
    editor?.onEditorContentChange(() => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setHeadings(editor), 200);
    });

    return () => {
      clearTimeout(timeout);
      resetHeadings();
    };
  }, [editor, resetHeadings, setHeadings]);
};
