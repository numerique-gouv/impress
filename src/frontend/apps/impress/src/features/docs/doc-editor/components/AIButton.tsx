import {
  useBlockNoteEditor,
  useComponentsContext,
  useSelectedBlocks,
} from '@blocknote/react';
import { useMemo } from 'react';

import { Box, BoxButton } from '@/components';

import { Doc } from '../../doc-management';
import { AIActions, useAIRewrite } from '../api/useAIRewrite';

interface AIGroupButtonProps {
  doc: Doc;
}

export function AIGroupButton({ doc }: AIGroupButtonProps) {
  const editor = useBlockNoteEditor();
  const Components = useComponentsContext();
  const selectedBlocks = useSelectedBlocks(editor);

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
        {[
          {
            label: 'Rephrase',
            action: 'rephrase',
          },
          {
            label: 'Summarize',
            action: 'summarize',
          },
          {
            label: 'Correct',
            action: 'correct',
          },
          {
            label: 'Translate to French',
            action: 'translate_fr',
          },
          {
            label: 'Translate to English',
            action: 'translate_en',
          },
          {
            label: 'Translate to German',
            action: 'translate_de',
          },
        ].map(({ label, action }) => (
          <AIButton
            key={`button-${action}`}
            action={action as AIActions}
            label={label}
            docId={doc.id}
          />
        ))}
      </Components.Generic.Menu.Dropdown>
    </Components.Generic.Menu.Root>
  );
}

interface AIButtonProps {
  action: AIActions;
  label: string;
  docId: Doc['id'];
}

const AIButton = ({ action, label, docId }: AIButtonProps) => {
  const editor = useBlockNoteEditor();
  const { mutateAsync: requestAI, isPending } = useAIRewrite();

  const handleRephraseAI = async (action: AIActions) => {
    const textCursorPosition = editor.getSelectedText();

    const newText = await requestAI({
      docId,
      text: textCursorPosition,
      action,
    });

    editor.insertInlineContent([
      newText,
      //{ type: 'text', text: 'World', styles: { bold: true } },
    ]);
  };

  return (
    <BoxButton
      key={`button-${action}`}
      $padding={{ horizontal: 'tiny', vertical: 'tiny' }}
      $margin="auto"
      onClick={() => void handleRephraseAI(action)}
      $hasTransition
      $radius="6px"
      $width="100%"
      $justify="center"
      $align="center"
      $gap="1rem"
      $css="&:hover{background-color: #f2f8ff;}text-transform: capitalize!important;"
      $direction="row"
    >
      {label}
      {isPending && <Box className="loader" />}
    </BoxButton>
  );
};
