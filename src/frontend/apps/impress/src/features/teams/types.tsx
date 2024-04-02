import { Access } from '@/features/members';

export enum Role {
  MEMBER = 'member',
  ADMIN = 'administrator',
  OWNER = 'owner',
}

export interface Team {
  id: string;
  name: string;
  accesses: Access[];
  created_at: string;
  updated_at: string;
  abilities: {
    delete: boolean;
    get: boolean;
    manage_accesses: boolean;
    patch: boolean;
    put: boolean;
  };
}
