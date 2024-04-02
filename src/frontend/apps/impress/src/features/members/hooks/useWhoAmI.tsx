import { useAuthStore } from '@/core/auth';
import { Role } from '@/features/teams';

import { Access } from '../types';

export const useWhoAmI = (access: Access) => {
  const { userData } = useAuthStore();

  const isMyself = userData?.id === access.user.id;
  const rolesAllowed = access.abilities.set_role_to;

  const isLastOwner =
    !rolesAllowed.length && access.role === Role.OWNER && isMyself;

  const isOtherOwner = access.role === Role.OWNER && userData?.id && !isMyself;

  return {
    isLastOwner,
    isOtherOwner,
    isMyself,
  };
};
