import { Doc, Role } from './types';

export const currentDocRole = (abilities: Doc['abilities']): Role => {
  return abilities.destroy
    ? Role.OWNER
    : abilities.manage_accesses
      ? Role.ADMIN
      : abilities.partial_update
        ? Role.EDITOR
        : Role.READER;
};
