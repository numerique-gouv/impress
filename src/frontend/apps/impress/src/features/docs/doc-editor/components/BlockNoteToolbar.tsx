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
} from '@blocknote/react';
import React from 'react';

import { AIGroupButton } from './AIButton';
import { MarkdownButton } from './MarkdownButton';

export const BlockNoteToolbar = () => {
  return (
    <FormattingToolbarController
      formattingToolbar={() => (
        <FormattingToolbar>
          <BlockTypeSelect key="blockTypeSelect" />

          {/* Extra button to do some AI powered actions */}
          <AIGroupButton key="AIButton" />

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
