import { User } from '@/core';

export interface Access {
  id: string;
  role: Role;
  team: string;
  user: User;
  abilities: {
    destroy: boolean;
    retrieve: boolean;
    set_role_to: Role[];
    update: boolean;
  };
}

export enum Role {
  READER = 'reader',
  EDITOR = 'editor',
  ADMIN = 'administrator',
  OWNER = 'owner',
}

export enum LinkReach {
  RESTRICTED = 'restricted',
  PUBLIC = 'public',
  AUTHENTICATED = 'authenticated',
}

export type Base64 = string;

export interface Doc {
  id: string;
  title: string;
  content: Base64;
  link_reach: LinkReach;
  link_role: 'reader' | 'editor';
  accesses: Access[];
  created_at: string;
  updated_at: string;
  abilities: {
    destroy: boolean;
    link_configuration: boolean;
    manage_accesses: boolean;
    partial_update: boolean;
    retrieve: boolean;
    update: boolean;
    versions_destroy: boolean;
    versions_list: boolean;
    versions_retrieve: boolean;
  };
}
