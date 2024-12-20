import { Server } from '@hocuspocus/server';

import { logger } from '@/utils';

export const hocusPocusServer = Server.configure({
  name: 'docs-collaboration',
  timeout: 30000,
  quiet: true,
  onConnect({ requestHeaders, connection, documentName, requestParameters }) {
    const roomParam = requestParameters.get('room');
    const canEdit = requestHeaders['x-can-edit'] === 'True';

    if (!canEdit) {
      connection.readOnly = true;
    }

    logger(
      'Connection established:',
      documentName,
      'userId:',
      requestHeaders['x-user-id'],
      'canEdit:',
      canEdit,
      'room:',
      requestParameters.get('room'),
    );

    if (documentName !== roomParam) {
      console.error(
        'Invalid room name - Probable hacking attempt:',
        documentName,
        requestParameters.get('room'),
        requestHeaders['x-user-id'],
      );

      return Promise.reject(new Error('Unauthorized'));
    }

    return Promise.resolve();
  },
});
