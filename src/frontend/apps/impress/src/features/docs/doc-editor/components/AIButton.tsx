import {
  useBlockNoteEditor,
  useComponentsContext,
  useEditorContentOrSelectionChange,
  useEditorSelectionChange,
  useSelectedBlocks,
} from '@blocknote/react';
import { useMemo } from 'react';

import { BoxButton } from '@/components';

import { Doc } from '../../doc-management';
import { AIActions, useAIRewrite } from '../api/useAIRewrite';

interface AIButtonProps {
  doc: Doc;
}

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

  const handleRephraseAI = async (action: AIActions) => {
    const textCursorPosition = editor.getSelectedText();
    const newText = await requestAI({
      docId: doc.id,
      text: textCursorPosition,
      action,
    });

    editor.insertInlineContent([
      newText,
      //{ type: 'text', text: 'World', styles: { bold: true } },
    ]);
  };

  const show = useMemo(() => {
    return !!selectedBlocks.find((block) => block.content !== undefined);
  }, [selectedBlocks]);

  if (!show || !editor.isEditable || !Components) {
    return null;
  }

  return (
    <Components.Generic.Menu.Root>
      <Components.Generic.Menu.Trigger>
        <Components.FormattingToolbar.Button
          className="bn-button"
          data-test="colors"
          label="AI"
          mainTooltip="AI Actions"
        >
          AI
        </Components.FormattingToolbar.Button>
      </Components.Generic.Menu.Trigger>
      <Components.Generic.Menu.Dropdown className="bn-menu-dropdown bn-color-picker-dropdown">
        {['rephrase', 'summarize', 'correct'].map((action) => (
          <BoxButton
            key={`button-${action}`}
            $padding={{ horizontal: 'small', vertical: 'tiny' }}
            $margin="auto"
            onClick={() => void handleRephraseAI('rephrase')}
            $hasTransition
            $radius="6px"
            $width="98%"
            $align="center"
            $css="&:hover{background-color: #f2f8ff;}text-transform: capitalize!important;"
          >
            {action}
          </BoxButton>
        ))}
      </Components.Generic.Menu.Dropdown>
    </Components.Generic.Menu.Root>
  );
}
