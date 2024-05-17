export interface Access {
  id: string;
  role: Role;
  team: string;
  user: string;
  abilities: {
    destroy: boolean;
    retrieve: boolean;
    set_role_to: Role[];
    update: boolean;
  };
}

export enum Role {
  MEMBER = 'member',
  ADMIN = 'administrator',
  OWNER = 'owner',
}

export type Base64 = string;

export interface Pad {
  id: string;
  title: string;
  content: Base64;
  is_public: boolean;
  accesses: Access[];
  created_at: string;
  updated_at: string;
  abilities: {
    destroy: boolean;
    retrieve: boolean;
    manage_accesses: boolean;
    update: boolean;
    partial_update: boolean;
  };
}
