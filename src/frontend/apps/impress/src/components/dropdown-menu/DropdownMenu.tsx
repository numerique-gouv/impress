import { Button } from '@openfun/cunningham-react';
import * as React from 'react';
import { PropsWithChildren } from 'react';

import { Box, DropButton, DropButtonProps } from '@/components';
import { Icon } from '@/components/icons/Icon';

export type DropdownMenuOption = {
  icon?: string;
  label: string;
  callback?: () => void | Promise<unknown>;
  danger?: boolean;
};

export type DropdownMenuProps = Omit<DropButtonProps, 'button'> & {
  options: DropdownMenuOption[];
  showArrow?: boolean;
  arrowClassname?: string;
};

export const DropdownMenu = ({
  options,
  children,
  showArrow = false,
  arrowClassname,
  ...dropButtonProps
}: PropsWithChildren<DropdownMenuProps>) => {
  const getButton = () => {
    if (!showArrow) {
      return children;
    }

    return (
      <div className="flex">
        <div>{children}</div>
        <Icon
          className={arrowClassname ?? 'clr-primary-500'}
          icon={dropButtonProps.isOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
        />
      </div>
    );
  };

  return (
    <DropButton {...dropButtonProps} button={getButton()}>
      <Box>
        {options.map((option) => (
          <Button
            size="small"
            key={option.label}
            onClick={() => {
              dropButtonProps.onOpenChange?.(false);
              void option.callback?.();
            }}
            color="primary-text"
            icon={
              option.icon ? (
                <span className="material-icons" aria-hidden="true">
                  {option.icon}
                </span>
              ) : undefined
            }
          >
            <span>{option.label}</span>
          </Button>
        ))}
      </Box>
    </DropButton>
  );
};
