import { SVGProps } from 'react';

import { Box } from '@/components';
import { useCunninghamTheme } from '@/cunningham';

import styles from './Burger.module.css';
import BurgerIcon from './burger.svg';

type BurgerProps = SVGProps<SVGSVGElement> & {
  isOpen: boolean;
};

export const Burger = ({ isOpen, ...props }: BurgerProps) => {
  const { colorsTokens } = useCunninghamTheme();

  return (
    <Box
      $color={colorsTokens()['primary-text']}
      $padding="none"
      $justify="center"
    >
      <BurgerIcon
        role="img"
        className={`${styles.burgerIcon} ${isOpen ? styles.open : ''}`}
        {...props}
      />
    </Box>
  );
};

export default Burger;
