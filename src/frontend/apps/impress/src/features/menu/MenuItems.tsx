import { usePathname } from 'next/navigation';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, BoxButton, StyledLink } from '@/components';
import { useCunninghamTheme } from '@/cunningham';
import { SVGComponent } from '@/types/components';

import { Tooltip } from './Tooltip';

interface MenuItemProps {
  Icon: SVGComponent;
  label: string;
  href: string;
  alias?: string[];
}

const MenuItem = ({ Icon, label, href, alias }: MenuItemProps) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { colorsTokens } = useCunninghamTheme();
  const parentRef = useRef(null);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const isActive =
    pathname === href ||
    alias?.includes(pathname) ||
    pathname.startsWith(`${href}/`) ||
    alias?.some((a) => pathname.startsWith(`${a}/`));

  const { color, background, colorTooltip, backgroundTooltip } = isActive
    ? {
        color: colorsTokens()['primary-600'],
        background: colorsTokens()['primary-300'],
        backgroundTooltip: 'white',
        colorTooltip: 'black',
      }
    : {
        color: '#ffffff55',
        background: undefined,
        backgroundTooltip: '#161616',
        colorTooltip: 'white',
      };

  return (
    <StyledLink
      href={href}
      aria-current={isActive && 'page'}
      ref={parentRef}
      onMouseOver={() => setIsTooltipOpen(true)}
      onMouseLeave={() => setIsTooltipOpen(false)}
      style={{ display: 'block' }}
    >
      <Box
        $margin="xtiny"
        $padding="tiny"
        as="li"
        $justify="center"
        $css={`
          & > button { padding: 0};
          transition: all 0.2s ease-in-out
        `}
        $background={background}
        $radius="10px"
      >
        <BoxButton aria-label={t(`{{label}} button`, { label })} $color={color}>
          <Icon
            width="2.375rem"
            aria-label={t(`{{label}} icon`, { label })}
            style={{
              transition: 'color 0.2s ease-in-out',
            }}
          />
        </BoxButton>
      </Box>
      {isTooltipOpen && (
        <Tooltip
          parentRef={parentRef}
          label={label}
          backgroundColor={backgroundTooltip}
          textColor={colorTooltip}
        />
      )}
    </StyledLink>
  );
};

export default MenuItem;
