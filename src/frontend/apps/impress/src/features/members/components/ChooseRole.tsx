import { Radio, RadioGroup } from '@openfun/cunningham-react';
import { useTranslation } from 'react-i18next';

import { Role } from '@/features/teams';

interface ChooseRoleProps {
  currentRole: Role;
  disabled: boolean;
  defaultRole: Role;
  setRole: (role: Role) => void;
}

export const ChooseRole = ({
  defaultRole,
  disabled,
  currentRole,
  setRole,
}: ChooseRoleProps) => {
  const { t } = useTranslation();

  return (
    <RadioGroup>
      <Radio
        label={t('Admin')}
        value={Role.ADMIN}
        name="role"
        onChange={(evt) => setRole(evt.target.value as Role)}
        defaultChecked={defaultRole === Role.ADMIN}
        disabled={disabled}
      />
      <Radio
        label={t('Member')}
        value={Role.MEMBER}
        name="role"
        onChange={(evt) => setRole(evt.target.value as Role)}
        defaultChecked={defaultRole === Role.MEMBER}
        disabled={disabled}
      />
      <Radio
        label={t('Owner')}
        value={Role.OWNER}
        name="role"
        onChange={(evt) => setRole(evt.target.value as Role)}
        defaultChecked={defaultRole === Role.OWNER}
        disabled={disabled || currentRole !== Role.OWNER}
      />
    </RadioGroup>
  );
};
