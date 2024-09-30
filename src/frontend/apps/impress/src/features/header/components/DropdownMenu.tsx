import { useState } from 'react';

import { Box, DropButton } from '@/components';
import { ButtonLogin } from '@/core';
import { useCunninghamTheme } from '@/cunningham';
import { LanguagePicker } from '@/features/language';

import { Burger } from './Burger/Burger';

export const DropdownMenu = () => {
  const { colorsTokens } = useCunninghamTheme();
  const [isDropOpen, setIsDropOpen] = useState(false);

  return (
    <DropButton
      button={
        <Burger
          isOpen={isDropOpen}
          width={30}
          height={30}
          aria-controls="menu"
        />
      }
      onOpenChange={(isOpen) => setIsDropOpen(isOpen)}
      isOpen={isDropOpen}
    >
      <Box $align="center" $direction="column">
        <Box
          $width="100%"
          $align="center"
          $height="36px"
          $justify="center"
          $css={`&:hover{background:${colorsTokens()['primary-150']}}`}
          $hasTransition
          $radius="2px"
        >
          <LanguagePicker />
        </Box>
        <ButtonLogin />
      </Box>
    </DropButton>
  );
};
