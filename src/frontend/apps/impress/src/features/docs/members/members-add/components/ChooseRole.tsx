import { Select } from '@openfun/cunningham-react';
import { useTranslation } from 'react-i18next';

import { Role, useTransRole } from '@/features/docs/doc-management';

interface ChooseRoleProps {
  currentRole: Role;
  disabled: boolean;
  defaultRole?: Role;
  setRole: (role: Role) => void;
}

export const ChooseRole = ({
  defaultRole,
  disabled,
  currentRole,
  setRole,
}: ChooseRoleProps) => {
  const { t } = useTranslation();
  const transRole = useTransRole();

  return (
    <Select
      label={t('Choose a role')}
      options={Object.values(Role).map((role) => ({
        label: transRole(role),
        value: role,
        disabled: currentRole !== Role.OWNER && role === Role.OWNER,
      }))}
      onChange={(evt) => setRole(evt.target.value as Role)}
      disabled={disabled}
      value={defaultRole}
    />
  );
};
