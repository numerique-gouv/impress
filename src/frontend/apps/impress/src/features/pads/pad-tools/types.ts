export enum Role {
  MEMBER = 'member',
  ADMIN = 'administrator',
  OWNER = 'owner',
}

export interface Access {
  id: string;
  abilities: {
    destroy: boolean;
    retrieve: boolean;
    set_role_to: Role[];
    update: boolean;
  };
  role: Role;
  team: string;
  user: string;
}

export interface Template {
  id: string;
  abilities: {
    destroy: boolean;
    generate_document: boolean;
    manage_accesses: boolean;
    retrieve: boolean;
    update: boolean;
    partial_update: boolean;
  };
  accesses: Access[];
  title: string;
  is_public: boolean;
  css: string;
  code: string;
}
