import { User } from '@/core/auth';
import { Role, Team } from '@/features/teams/';

export interface Access {
  id: string;
  role: Role;
  user: User;
  abilities: {
    delete: boolean;
    get: boolean;
    patch: boolean;
    put: boolean;
    set_role_to: Role[];
  };
}

export interface Invitation {
  id: string;
  created_at: string;
  email: string;
  team: Team['id'];
  role: Role;
  issuer: User['id'];
  is_expired: boolean;
}
