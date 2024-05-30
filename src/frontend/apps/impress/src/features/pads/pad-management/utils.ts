import { Pad, Role } from './types';

export const currentDocRole = (doc: Pad): Role => {
  return doc.abilities.destroy
    ? Role.OWNER
    : doc.abilities.manage_accesses
      ? Role.ADMIN
      : doc.abilities.partial_update
        ? Role.EDITOR
        : Role.READER;
};
