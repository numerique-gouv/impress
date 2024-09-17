import '@blocknote/mantine/style.css';
import {
  BasicTextStyleButton,
  BlockTypeSelect,
  ColorStyleButton,
  CreateLinkButton,
  FormattingToolbar,
  FormattingToolbarController,
  NestBlockButton,
  TextAlignButton,
  UnnestBlockButton,
  useBlockNoteEditor,
  useComponentsContext,
  useSelectedBlocks,
} from '@blocknote/react';
import { forEach, isArray } from 'lodash';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const BlockNoteToolbar = () => {
  return (
    <FormattingToolbarController
      formattingToolbar={() => (
        <FormattingToolbar>
          <BlockTypeSelect key="blockTypeSelect" />

          {/* Extra button to convert from markdown to json */}
          <MarkdownButton key="customButton" />

          <BasicTextStyleButton basicTextStyle="bold" key="boldStyleButton" />
          <BasicTextStyleButton
            basicTextStyle="italic"
            key="italicStyleButton"
          />
          <BasicTextStyleButton
            basicTextStyle="underline"
            key="underlineStyleButton"
          />
          <BasicTextStyleButton
            basicTextStyle="strike"
            key="strikeStyleButton"
          />
          {/* Extra button to toggle code styles */}
          <BasicTextStyleButton key="codeStyleButton" basicTextStyle="code" />

          <TextAlignButton textAlignment="left" key="textAlignLeftButton" />
          <TextAlignButton textAlignment="center" key="textAlignCenterButton" />
          <TextAlignButton textAlignment="right" key="textAlignRightButton" />

          <ColorStyleButton key="colorStyleButton" />

          <NestBlockButton key="nestBlockButton" />
          <UnnestBlockButton key="unnestBlockButton" />

          <CreateLinkButton key="createLinkButton" />
        </FormattingToolbar>
      )}
    />
  );
};

type Block = {
  type: string;
  text: string;
  content: Block[];
};

function isBlock(block: Block): block is Block {
  return (
    block.content &&
    isArray(block.content) &&
    block.content.length > 0 &&
    typeof block.type !== 'undefined'
  );
}

const recursiveContent = (content: Block[], base: string = '') => {
  let fullContent = base;
  for (const innerContent of content) {
    if (innerContent.type === 'text') {
      fullContent += innerContent.text;
    } else if (isBlock(innerContent)) {
      fullContent = recursiveContent(innerContent.content, fullContent);
    }
  }

  return fullContent;
};

/**
 * Custom Formatting Toolbar Button to convert markdown to json.
 */
export function MarkdownButton() {
  const editor = useBlockNoteEditor();
  const Components = useComponentsContext();
  const selectedBlocks = useSelectedBlocks(editor);
  const { t } = useTranslation();

  const handleConvertMarkdown = () => {
    const blocks = editor.getSelection()?.blocks;

    forEach(blocks, async (block) => {
      if (!isBlock(block as unknown as Block)) {
        return;
      }

      try {
        const fullContent = recursiveContent(
          block.content as unknown as Block[],
        );

        const blockMarkdown =
          await editor.tryParseMarkdownToBlocks(fullContent);
        editor.replaceBlocks([block.id], blockMarkdown);
      } catch (error) {
        console.error('Error parsing Markdown:', error);
      }
    });
  };

  const show = useMemo(() => {
    return !!selectedBlocks.find((block) => block.content !== undefined);
  }, [selectedBlocks]);

  if (!show || !editor.isEditable || !Components) {
    return null;
  }

  return (
    <Components.FormattingToolbar.Button
      mainTooltip={t('Convert Markdown')}
      onClick={handleConvertMarkdown}
    >
      M
    </Components.FormattingToolbar.Button>
  );
}
