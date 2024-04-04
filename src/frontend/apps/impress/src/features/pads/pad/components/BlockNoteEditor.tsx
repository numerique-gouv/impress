import { BlockNoteView, useCreateBlockNote } from '@blocknote/react';
import '@blocknote/react/style.css';
import React from 'react';
import { WebrtcProvider } from 'y-webrtc';
import * as Y from 'yjs';

const doc = new Y.Doc();
const provider = new WebrtcProvider('my-document-id4', doc, {
  signaling: ['ws://localhost:4444'],
});

export const BlockNoteEditor = () => {
  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment: doc.getXmlFragment('document-store'),
      user: {
        name: 'My Username',
        color: '#ff0000',
      },
    },
  });

  return <BlockNoteView editor={editor} />;
};
