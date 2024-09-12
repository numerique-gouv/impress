import {
  useBlockNoteEditor,
  useComponentsContext,
  useEditorContentOrSelectionChange,
  useEditorSelectionChange,
  useSelectedBlocks,
} from '@blocknote/react';
import { useMemo } from 'react';

import { useAIRewrite } from '../api/useAIRewrite';

/**
 * Custom Formatting Toolbar Button to convert markdown to json.
 */
export function AIButton() {
  const editor = useBlockNoteEditor();
  const Components = useComponentsContext();
  const selectedBlocks = useSelectedBlocks(editor);
  useEditorSelectionChange(() => {
    console.log('Selection changed');
  }, editor);
  useEditorContentOrSelectionChange(() => {
    console.log('Content or selection changed');
  }, editor);
  const { mutateAsync: requestAI, data } = useAIRewrite();

  console.log('Data', data);

  const handleRephraseAI = async () => {
    console.log('Rephrase with AI', editor.getSelection());
    console.log('Rephrase with BLockkk', selectedBlocks);

    await requestAI({
      docId: '901ac9b3-97a4-4f37-adcf-1941746b3c61',
      text: 'toto',
      action: 'rephrase',
    });

    // Call backend endpoint to rephrase the selected block

    editor.replaceBlocks(
      [selectedBlocks[0]],
      [
        {
          content:
            'This block was replaced at ' + new Date().toLocaleTimeString(),
        },
      ],
    );

    // forEach(blocks, async (block) => {
    //   if (!isBlock(block as unknown as Block)) {
    //     return;
    //   }

    //   try {
    //     const fullContent = recursiveContent(
    //       block.content as unknown as Block[],
    //     );

    //     const blockMarkdown =
    //       await editor.tryParseMarkdownToBlocks(fullContent);
    //     editor.replaceBlocks([block.id], blockMarkdown);
    //   } catch (error) {
    //     console.error('Error parsing Markdown:', error);
    //   }
    // });
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
