import { defaultProps } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import React from 'react';

import {
  DropdownMenu,
  DropdownMenuOption,
} from '@/components/dropdown-menu/DropdownMenu';
import { useDropdownMenu } from '@/components/dropdown-menu/useDropdownMenu';

import style from './alert-block.module.scss';

const alertTypes = [
  { value: 'default', icon: 'info' },
  { value: 'warning', icon: 'warning' },
  { value: 'info', icon: 'info' },
  { value: 'error', icon: 'cancel' },
  { value: 'success', icon: 'check_circle' },
];

export const Alert = createReactBlockSpec(
  {
    type: 'alert',
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      type: {
        default: 'default',
        values: alertTypes.map((value) => value.value),
      },
    },
    content: 'inline',
  },
  {
    render: (props) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const dropdown = useDropdownMenu();
      const aa: DropdownMenuOption[] = alertTypes.map((type) => {
        return {
          label: type.value,
          icon: type.icon,
          callback: () =>
            void props.editor.updateBlock(props.block, {
              type: 'alert',
              props: { type: type.value },
            }),
        };
      });

      const getIcon = () => {
        const index = alertTypes.findIndex(
          (type) => type.value === props.block.props.type,
        );

        if (index >= 0) {
          return alertTypes[index].icon;
        }
        return 'info';
      };

      return (
        <div
          className={`${style.alertContainer} ${style[props.block.props.type]}`}
        >
          <div contentEditable={false} className={style.icon}>
            <DropdownMenu {...dropdown} options={aa}>
              <span
                className={`${style.alertIcon} material-icons`}
                data-alert-icon-type={props.block.props.type}
              >
                {getIcon()}
              </span>
            </DropdownMenu>
          </div>

          <div className={`${style.content}`} ref={props.contentRef} />
        </div>
      );
    },
  },
);
