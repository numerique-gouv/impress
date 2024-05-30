import { Access } from '../pad-management';

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
