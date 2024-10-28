import { filterSuggestionItems } from '@blocknote/core';
import {
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from '@blocknote/react';
import * as React from 'react';

import { DocsEditor } from '@/features/docs';
import { insertMenuAlertBlock } from '@/features/docs/doc-editor/components/custom-blocks/alert/insertMenuAlertBlock';

type Props = {
  editor: DocsEditor;
};
export const SuggestionMenuEditor = ({ editor }: Props) => {
  const getItem = async (query: string): Promise<never[]> => {
    return new Promise((resolve) => {
      const result = filterSuggestionItems(
        [
          ...getDefaultReactSlashMenuItems(editor),
          insertMenuAlertBlock(editor),
        ],
        query,
      );
      resolve(result as never[]);
    });
  };
  return <SuggestionMenuController triggerCharacter="/" getItems={getItem} />;
};
