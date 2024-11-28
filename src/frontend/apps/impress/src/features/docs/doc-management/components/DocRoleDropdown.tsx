import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { DropdownMenu, DropdownMenuOption, Text } from '@/components';

import { useTrans } from '../hooks';
import { Role } from '../types';

type Props = {
  currentRole: Role;
  onSelectRole?: (role: Role) => void;
  canUpdate?: boolean;
  isLastOwner?: boolean;
  isOtherOwner?: boolean;
};
export const DocRoleDropdown = ({
  canUpdate = true,
  currentRole,
  onSelectRole,
  isLastOwner,
  isOtherOwner,
}: Props) => {
  const { t } = useTranslation();
  const { transRole, translatedRoles, getNotAllowedMessage } = useTrans();

  const roles: DropdownMenuOption[] = Object.keys(translatedRoles).map(
    (key) => {
      return {
        label: transRole(key as Role),
        callback: () => onSelectRole?.(key as Role),
        disabled: isLastOwner || isOtherOwner,
        isSelected: currentRole === (key as Role),
      };
    },
  );

  if (!canUpdate) {
    return (
      <Text
        $variation="600"
        $css={css`
          font-family: Arial, Helvetica, sans-serif;
        `}
      >
        {transRole(currentRole)}
      </Text>
    );
  }

  return (
    <DropdownMenu
      topMessage={getNotAllowedMessage(
        canUpdate,
        !!isLastOwner,
        !!isOtherOwner,
      )}
      label="doc-role-dropdown"
      showArrow={true}
      options={roles}
    >
      <Text
        $variation="600"
        $css={css`
          font-family: Arial, Helvetica, sans-serif;
        `}
      >
        {transRole(currentRole)}
      </Text>
    </DropdownMenu>
  );
};
