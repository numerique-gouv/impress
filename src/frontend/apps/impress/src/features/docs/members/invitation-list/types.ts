import { Role } from '@/features/docs/doc-management';

export interface Invitation {
  id: string;
  role: Role;
  document: string;
  created_at: string;
  is_expired: boolean;
  issuer: string;
  email: string;
  abilities: {
    destroy: boolean;
    retrieve: boolean;
    partial_update: boolean;
    update: boolean;
  };
}
