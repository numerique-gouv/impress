import { Radio, RadioGroup } from '@openfun/cunningham-react';
import { useTranslation } from 'react-i18next';

import { Role } from '@/features/pads/pad-management';

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

  const translatedRoles = {
    [Role.ADMIN]: t('Administrator'),
    [Role.READER]: t('Reader'),
    [Role.OWNER]: t('Owner'),
    [Role.EDITOR]: t('Editor'),
  };

  return (
    <RadioGroup>
      {Object.values(Role).map((role) => (
        <Radio
          key={role}
          label={translatedRoles[role]}
          value={role}
          name="role"
          onChange={(evt) => setRole(evt.target.value as Role)}
          defaultChecked={defaultRole === role}
          disabled={
            disabled || (currentRole !== Role.OWNER && role === Role.OWNER)
          }
        />
      ))}
    </RadioGroup>
  );
};
