import { insertOrUpdateBlock } from '@blocknote/core';

import { blockNoteSchema } from '@/features/docs';

export const insertMenuAlertBlock = (
  editor: typeof blockNoteSchema.BlockNoteEditor,
) => ({
  title: 'Alert',
  onItemClick: () => {
    insertOrUpdateBlock(editor, {
      type: 'alert',
    });
  },
  aliases: [
    'alert',
    'notification',
    'emphasize',
    'warning',
    'error',
    'info',
    'success',
  ],
  group: 'Other',
  icon: <span className="material-icons">infos</span>,
});
