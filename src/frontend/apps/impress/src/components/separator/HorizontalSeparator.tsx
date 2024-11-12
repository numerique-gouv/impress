import classNames from 'classnames';

import style from './separator.module.scss';

export enum SeparatorVariant {
  LIGHT = 'light',
  DARK = 'dark',
}

type Props = {
  variant?: SeparatorVariant;
};

export const HorizontalSeparator = ({
  variant = SeparatorVariant.LIGHT,
}: Props) => {
  return (
    <div
      className={classNames(style.horizontal, {
        [style.dark]: variant === SeparatorVariant.DARK,
        [style.light]: variant === SeparatorVariant.LIGHT,
      })}
    />
  );
};
