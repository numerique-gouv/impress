import {
  useBlockNoteEditor,
  useComponentsContext,
  useEditorContentOrSelectionChange,
  useEditorSelectionChange,
  useSelectedBlocks,
} from '@blocknote/react';
import { useMemo } from 'react';

import { Doc } from '../../doc-management';
import { useAIRewrite } from '../api/useAIRewrite';

interface AIButtonProps {
  doc: Doc;
}

/**
 * Custom Formatting Toolbar Button to convert markdown to json.
 */
export function AIButton({ doc }: AIButtonProps) {
  const editor = useBlockNoteEditor();
  const Components = useComponentsContext();
  const selectedBlocks = useSelectedBlocks(editor);
  useEditorSelectionChange(() => {
    console.log('Selection changed');
  }, editor);
  useEditorContentOrSelectionChange(() => {
    console.log('Content or selection changed');
  }, editor);
  const { mutateAsync: requestAI } = useAIRewrite();

  const handleRephraseAI = async () => {
    const textCursorPosition = editor.getSelectedText();
    const newText = await requestAI({
      docId: doc.id,
      text: textCursorPosition,
      action: 'rephrase',
    });

    editor.replaceBlocks(
      [selectedBlocks[0]],
      [
        {
          content: newText,
        },
      ],
    );
  };

  const show = useMemo(() => {
    return !!selectedBlocks.find((block) => block.content !== undefined);
  }, [selectedBlocks]);

  if (!show || !editor.isEditable || !Components) {
    return null;
  }

  return (
    <Components.FormattingToolbar.Button
      mainTooltip="Rephrase with AI"
      onClick={() => void handleRephraseAI()}
    >
      Rephrase
    </Components.FormattingToolbar.Button>
  );
}
