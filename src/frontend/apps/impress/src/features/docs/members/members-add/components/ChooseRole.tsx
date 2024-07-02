import { Radio, RadioGroup } from '@openfun/cunningham-react';

import { Role, useTransRole } from '@/features/docs/doc-management';

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
  const transRole = useTransRole();

  return (
    <RadioGroup>
      {Object.values(Role).map((role) => (
        <Radio
          key={role}
          label={transRole(role)}
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
