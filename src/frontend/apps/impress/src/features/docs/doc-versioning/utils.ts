import * as Y from 'yjs';

/**
 * Revert the doc to a previous state.
 *
 * We cannot simply replace a doc with another previous doc,
 * because Y.js will act as if the previous doc is a new doc and so
 * merge it with the current doc, so we need to revert the doc (undo).
 *
 * To do so we simulate a history of the doc by saving snapshots of the doc
 * and then revert the doc to a previous snapshot.
 *
 * @param doc
 * @param snapshotOrigin
 * @param snapshotUpdate
 */
export function revertUpdate(
  doc: Y.Doc,
  snapshotOrigin: Y.Doc,
  snapshotUpdate: Y.Doc,
) {
  try {
    const snapshotDoc = new Y.Doc();
    Y.applyUpdate(
      snapshotDoc,
      Y.encodeStateAsUpdate(snapshotUpdate),
      snapshotOrigin,
    );

    const currentStateVector = Y.encodeStateVector(doc);
    const snapshotStateVector = Y.encodeStateVector(snapshotDoc);

    const changesSinceSnapshotUpdate = Y.encodeStateAsUpdate(
      doc,
      snapshotStateVector,
    );

    const undoManager = new Y.UndoManager(
      [snapshotDoc.getMap('document-store')],
      {
        trackedOrigins: new Set([snapshotOrigin]),
      },
    );

    Y.applyUpdate(snapshotDoc, changesSinceSnapshotUpdate, snapshotOrigin);
    undoManager.undo();
    const revertChangesSinceSnapshotUpdate = Y.encodeStateAsUpdate(
      snapshotDoc,
      currentStateVector,
    );
    Y.applyUpdate(doc, revertChangesSinceSnapshotUpdate, snapshotOrigin);
  } catch (e) {
    console.error('Failed to revert the doc to a previous state', e);
  }
}
