import classNames from 'classnames';
import { PropsWithChildren } from 'react';

import styles from './separator.module.scss';

type Props = {
  showSeparator?: boolean;
};

export const SeparatedSection = ({
  showSeparator = true,
  children,
}: PropsWithChildren<Props>) => {
  return (
    <div
      className={classNames(styles.separatedContainer, {
        [styles.showSeparator]: showSeparator,
      })}
    >
      {children}
    </div>
  );
};
