import { ComponentPropsWithRef, forwardRef } from 'react';

import { Box, BoxType } from './Box';

export type BoxButtonType = ComponentPropsWithRef<typeof BoxButton>;

/**
 * Styleless button that extends the Box component.
 * Good to wrap around SVGs or other elements that need to be clickable.
 * @param props - @see BoxType props
 * @param ref
 * @see Box
 * @example
 * ```tsx
 *  <BoxButton $radius="100%" aria-label="My button" onClick={() => console.log('clicked')}>
 *    Click me
 *  </BoxButton>
 * ```
 */
const BoxButton = forwardRef<HTMLDivElement, BoxType>(
  ({ $css, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        as="button"
        $background="none"
        $css={`
          cursor: pointer;
          border: none;
          outline: none;
          transition: all 0.2s ease-in-out;
          ${$css || ''}
        `}
        {...props}
      />
    );
  },
);

BoxButton.displayName = 'BoxButton';
export { BoxButton };
