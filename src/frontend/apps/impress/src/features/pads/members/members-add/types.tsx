import { User } from '@/core/auth';
import { Pad, Role } from '@/features/pads/pad-management';

export enum OptionType {
  INVITATION = 'invitation',
  NEW_MEMBER = 'new_member',
}

export const isOptionNewMember = (
  data: OptionSelect,
): data is OptionNewMember => {
  return 'id' in data.value;
};

export interface OptionInvitation {
  value: { email: string };
  label: string;
  type: OptionType.INVITATION;
}

export interface OptionNewMember {
  value: User;
  label: string;
  type: OptionType.NEW_MEMBER;
}

export type OptionSelect = OptionNewMember | OptionInvitation;

export interface DocInvitation {
  id: string;
  created_at: string;
  email: string;
  team: Pad['id'];
  role: Role;
  issuer: User['id'];
}
