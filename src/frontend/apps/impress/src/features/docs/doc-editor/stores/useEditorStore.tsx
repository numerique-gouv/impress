import { BlockNoteEditor } from '@blocknote/core';
import { create } from 'zustand';

export interface UseEditorstore {
  editor?: BlockNoteEditor;
  setEditor: (editor: BlockNoteEditor | undefined) => void;
}

export const useEditorStore = create<UseEditorstore>((set) => ({
  editor: undefined,
  setEditor: (editor) => {
    set({ editor });
  },
}));
