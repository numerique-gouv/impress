import { User } from '@/core/auth';

import { Pad, Role } from '../pad-management';

export enum OptionType {
  INVITATION = 'invitation',
  NEW_USER = 'new_user',
}

export const isOptionNewUser = (data: OptionSelect): data is OptionNewUser => {
  return 'id' in data.value;
};

export interface OptionInvitation {
  value: { email: string };
  label: string;
  type: OptionType.INVITATION;
}

export interface OptionNewUser {
  value: User;
  label: string;
  type: OptionType.NEW_USER;
}

export type OptionSelect = OptionNewUser | OptionInvitation;

export interface DocInvitation {
  id: string;
  created_at: string;
  email: string;
  team: Pad['id'];
  role: Role;
  issuer: User['id'];
}
