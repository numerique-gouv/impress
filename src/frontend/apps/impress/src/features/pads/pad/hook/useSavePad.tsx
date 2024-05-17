import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';

import { useUpdatePad } from '../api/useUpdatePad';
import { toBase64 } from '../utils';

const useSavePad = (padId: string, doc: Y.Doc) => {
  const { mutate: updatePad } = useUpdatePad();
  const [initialDoc, setInitialDoc] = useState<string>(
    toBase64(Y.encodeStateAsUpdate(doc)),
  );

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

  const savePad = useCallback(() => {
    const newDoc = toBase64(Y.encodeStateAsUpdate(doc));

    /**
     * Save only if the doc has changed.
     */
    if (initialDoc === newDoc) {
      return;
    }

    setInitialDoc(newDoc);

    updatePad({
      id: padId,
      content: newDoc,
    });
  }, [initialDoc, padId, doc, updatePad]);

  const timeout = useRef<NodeJS.Timeout>();
  const router = useRouter();

  useEffect(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    const onSave = () => {
      savePad();
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
  }, [router.events, savePad]);
};

export default useSavePad;
