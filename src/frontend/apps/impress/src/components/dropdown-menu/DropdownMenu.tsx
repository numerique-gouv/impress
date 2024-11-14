import { PropsWithChildren, useMemo } from 'react';

import { DropButton, DropButtonProps } from '@/components';
import { Icon } from '@/components/Icon';

import styles from './dropdown-menu.module.scss';

export type DropdownMenuOption = {
  icon?: string;
  label: string;
  callback?: () => void | Promise<unknown>;
  danger?: boolean;
  show?: boolean;
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
  const showDropdown = useMemo(() => {
    let show = false;
    options.forEach((option) => {
      show = show || (option.show !== undefined ? option.show : true);
    });
    return show;
  }, [options]);

  const getButton = () => {
    if (!showArrow) {
      return children;
    }

    return (
      <div className={styles.withArrowContainer}>
        <div>{children}</div>
        <Icon
          className={arrowClassname ?? 'clr-primary-600'}
          iconName={
            dropButtonProps.isOpen ? 'arrow_drop_up' : 'arrow_drop_down'
          }
        />
      </div>
    );
  };

  if (!showDropdown) {
    return;
  }

  return (
    <DropButton {...dropButtonProps} button={getButton()}>
      <div className={styles.listOption}>
        {options.map((option) => {
          if (option.show !== undefined && !option.show) {
            return;
          }
          return (
            <button
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                dropButtonProps.onOpenChange?.(false);
                void option.callback?.();
              }}
              key={option.label}
              className={styles.item}
            >
              {option.icon && (
                <Icon className={styles.itemIcon} iconName={option.icon} />
              )}
              {option.label}
            </button>
          );
        })}
      </div>
    </DropButton>
  );
};
