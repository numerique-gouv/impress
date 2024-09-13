import {
  useBlockNoteEditor,
  useComponentsContext,
  useSelectedBlocks,
} from '@blocknote/react';
import { ReactNode, useMemo } from 'react';

import { Box, BoxButton, Text } from '@/components';

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
            label: (
              <>
                <Text $isMaterialIcon $size="m">
                  text_fields
                </Text>{' '}
                Use as prompt
              </>
            ),
            action: 'prompt',
          },
          {
            label: (
              <>
                <Text $isMaterialIcon $size="m">
                  refresh
                </Text>{' '}
                Rephrase
              </>
            ),
            action: 'rephrase',
          },
          {
            label: (
              <>
                <Text $isMaterialIcon $size="m">
                  summarize
                </Text>{' '}
                Summarize
              </>
            ),
            action: 'summarize',
          },
          {
            label: (
              <>
                <Text $isMaterialIcon $size="m">
                  check
                </Text>{' '}
                Correct
              </>
            ),
            action: 'correct',
          },
          {
            label: (
              <>
                <Text $isMaterialIcon $size="m">
                  translate
                </Text>{' '}
                FR
              </>
            ),
            action: 'translate_fr',
          },
          {
            label: (
              <>
                <Text $isMaterialIcon $size="m">
                  translate
                </Text>{' '}
                EN
              </>
            ),
            action: 'translate_en',
          },
          {
            label: (
              <>
                <Text $isMaterialIcon $size="m">
                  translate
                </Text>{' '}
                DE
              </>
            ),
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
  label: ReactNode;
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
      $justify="flex-start"
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
