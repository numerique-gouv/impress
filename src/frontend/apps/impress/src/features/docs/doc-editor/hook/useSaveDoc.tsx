import { BlockNoteEditor } from '@blocknote/core';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';

import { useUpdateDoc } from '@/features/docs/doc-management/';
import { KEY_LIST_DOC_VERSIONS } from '@/features/docs/doc-versioning';

import { toBase64 } from '../utils';
import { useE2ESDKClient } from '@socialgouv/e2esdk-react';

const useSaveDoc = (
  docId: string,
  doc: Y.Doc,
  canSave: boolean,
  editor: BlockNoteEditor,
) => {
  const { mutate: updateDoc } = useUpdateDoc({
    listInvalideQueries: [KEY_LIST_DOC_VERSIONS],
  });
  const e2eClient = useE2ESDKClient();
  const [initialDoc, setInitialDoc] = useState<string>(
    JSON.stringify(editor.document)
  );

  useEffect(() => {
    setInitialDoc(JSON.stringify(editor.document));
  }, [doc]);

  /**
   * Update initial doc when doc is updated by other users,
   * so only the user typing will trigger the save.
   * This is to avoid saving the same doc multiple time.
   */
  useEffect(() => {
    const onUpdate = (
      _uintArray: Uint8Array,
      _pluginKey: string,
      updatedDoc: Y.Doc,
      transaction: Y.Transaction,
    ) => {
      if (!transaction.local) {
        setInitialDoc(JSON.stringify(editor.document));
      }
    };

    doc.on('update', onUpdate);

    return () => {
      doc.off('update', onUpdate);
    };
  }, [doc]);

  /**
   * Check if the doc has been updated and can be saved.
   */
  const hasChanged = useCallback(() => {
    return initialDoc !== JSON.stringify(editor.document);
  }, [doc, initialDoc]);

  const shouldSave = useCallback(() => {
    console.log('hasChanged', hasChanged(), 'canSave', canSave);
    return hasChanged() && canSave;
  }, [canSave, hasChanged]);

  const saveDoc = useCallback(() => {
    const newDoc = JSON.stringify(editor.document);
    //const newDoc = toBase64(Y.encodeStateAsUpdate(doc));

    // TODO encode the content

    const purpose = `docs:${docId}`;
    const key = e2eClient.findKeyByPurpose(purpose);
    console.log("purpose", purpose, "key", key);
    if (!key) {
      alert('probleme de key');
      return;
    }

    const encrypted = e2eClient.encrypt(newDoc, key.keychainFingerprint);

    console.log('encrypted', encrypted);

    // todo

    setInitialDoc(newDoc);

    updateDoc({
      id: docId,
      content: encrypted,
    });
  }, [docId, editor?.document, updateDoc]);

  const timeout = useRef<NodeJS.Timeout>();
  const router = useRouter();

  useEffect(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    const onSave = (e?: Event) => {
      console.log('entered onSave');
      if (!shouldSave()) {
        return;
      }

      console.log('will save');
      saveDoc();

      /**
       * Firefox does not trigger the request everytime the user leaves the page.
       * Plus the request is not intercepted by the service worker.
       * So we prevent the default behavior to have the popup asking the user
       * if he wants to leave the page, by adding the popup, we let the time to the
       * request to be sent, and intercepted by the service worker (for the offline part).
       */
      const isFirefox =
        navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

      if (typeof e !== 'undefined' && e.preventDefault && isFirefox) {
        e.preventDefault();
      }
    };

    // Save every minute
    timeout.current = setInterval(onSave, 1000);
    // Save when the user leaves the page
    addEventListener('beforeunload', onSave);
    // Save when the user navigates to another page
    router.events.on('routeChangeStart', onSave);

    return () => {
      clearTimeout(timeout.current);
      removeEventListener('beforeunload', onSave);
      router.events.off('routeChangeStart', onSave);
    };
  }, [router.events, saveDoc, shouldSave]);
};

export default useSaveDoc;
