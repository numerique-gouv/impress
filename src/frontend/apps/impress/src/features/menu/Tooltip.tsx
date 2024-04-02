import { Popover } from '@openfun/cunningham-react';
import React, { CSSProperties, useEffect, useState } from 'react';

import { Box, Text } from '@/components/';

interface TooltipProps {
  parentRef: React.MutableRefObject<null>;
  textColor: CSSProperties['color'];
  backgroundColor: CSSProperties['color'];
  label: string;
}

export const Tooltip = ({
  parentRef,
  backgroundColor,
  textColor,
  label,
}: TooltipProps) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    setOpacity(1);
  }, []);

  return (
    <Popover parentRef={parentRef} onClickOutside={() => ''} borderless>
      <Box
        aria-label="tooltip"
        className="ml-t p-t"
        $background={backgroundColor}
        $radius="4px"
        $css={`
          transition: opacity 0.2s ease-in-out;
          box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.25);
          opacity: ${opacity};

          /* Arrow */
          &::after {
            position: absolute;
            content: "";
            top: -7px;
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-bottom: 7px solid ${backgroundColor};
          }
        `}
      >
        <Text $weight={400} $size="12px" $color={textColor}>
          {label}
        </Text>
      </Box>
    </Popover>
  );
};
