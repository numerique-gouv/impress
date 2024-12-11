import { BlockNoteEditor } from '@blocknote/core';
import { useEffect } from 'react';

import { useHeadingStore } from '../stores';

export const useHeadings = (editor: BlockNoteEditor) => {
  const { setHeadings, resetHeadings } = useHeadingStore();

  useEffect(() => {
    setHeadings(editor);

    editor?.onEditorContentChange(() => {
      setHeadings(editor);
    });

    return () => {
      resetHeadings();
    };
  }, [editor, resetHeadings, setHeadings]);
};
