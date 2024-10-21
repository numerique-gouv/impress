import '@blocknote/mantine/style.css';
import {
  FormattingToolbar,
  FormattingToolbarController,
  getFormattingToolbarItems,
} from '@blocknote/react';
import React from 'react';

import { AIGroupButton } from './AIButton';
import { MarkdownButton } from './MarkdownButton';

export const BlockNoteToolbar = () => {
  return (
    <FormattingToolbarController
      formattingToolbar={({ blockTypeSelectItems }) => (
        <FormattingToolbar>
          {getFormattingToolbarItems(blockTypeSelectItems)}

          {/* Extra button to do some AI powered actions */}
          <AIGroupButton key="AIButton" />

          {/* Extra button to convert from markdown to json */}
          <MarkdownButton key="customButton" />
        </FormattingToolbar>
      )}
    />
  );
};
