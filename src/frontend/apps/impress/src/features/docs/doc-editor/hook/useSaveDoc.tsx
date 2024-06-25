import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';

import { useUpdateDoc } from '@/features/docs/doc-management/';

import { toBase64 } from '../utils';

const useSaveDoc = (docId: string, doc: Y.Doc, canSave: boolean) => {
  const { mutate: updateDoc } = useUpdateDoc();
  const [initialDoc, setInitialDoc] = useState<string>(
    toBase64(Y.encodeStateAsUpdate(doc)),
  );

  useEffect(() => {
    setInitialDoc(toBase64(Y.encodeStateAsUpdate(doc)));
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
        setInitialDoc(toBase64(Y.encodeStateAsUpdate(updatedDoc)));
      }
    };

    doc.on('update', onUpdate);

    return () => {
      doc.off('update', onUpdate);
    };
  }, [doc]);

  const saveDoc = useCallback(() => {
    const newDoc = toBase64(Y.encodeStateAsUpdate(doc));

    /**
     * Save only if the doc has changed.
     */
    if (initialDoc === newDoc || !canSave) {
      return;
    }

    setInitialDoc(newDoc);

    updateDoc({
      id: docId,
      content: newDoc,
    });
  }, [initialDoc, docId, doc, updateDoc, canSave]);

  const timeout = useRef<NodeJS.Timeout>();
  const router = useRouter();

  useEffect(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    const onSave = () => {
      saveDoc();
    };

    // Save every minute
    timeout.current = setInterval(onSave, 60000);
    // Save when the user leaves the page
    addEventListener('beforeunload', onSave);
    // Save when the user navigates to another page
    router.events.on('routeChangeStart', onSave);

    return () => {
      clearTimeout(timeout.current);
      removeEventListener('beforeunload', onSave);
      router.events.off('routeChangeStart', onSave);
    };
  }, [router.events, saveDoc]);
};

export default useSaveDoc;
