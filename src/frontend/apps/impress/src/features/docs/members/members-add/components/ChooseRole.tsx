import { Select } from '@openfun/cunningham-react';
import { useTranslation } from 'react-i18next';

import { Role, useTrans } from '@/features/docs/doc-management';

interface ChooseRoleProps {
  currentRole: Role;
  disabled: boolean;
  defaultRole?: Role;
  setRole: (role: Role) => void;
  label?: string;
}

export const ChooseRole = ({
  defaultRole,
  disabled,
  currentRole,
  setRole,
  label,
}: ChooseRoleProps) => {
  const { t } = useTranslation();
  const { transRole } = useTrans();

  return (
    <Select
      label={label || t('Choose a role')}
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
