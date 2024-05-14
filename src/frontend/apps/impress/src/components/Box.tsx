import { ComponentPropsWithRef, ReactHTML } from 'react';
import styled from 'styled-components';
import { CSSProperties } from 'styled-components/dist/types';

import {
  MarginPadding,
  stylesMargin,
  stylesPadding,
} from '@/utils/styleBuilder';

import { hideEffect, showEffect } from './Effect';

export interface BoxProps {
  as?: keyof ReactHTML;
  $align?: CSSProperties['alignItems'];
  $background?: CSSProperties['background'];
  $color?: CSSProperties['color'];
  $css?: string;
  $direction?: CSSProperties['flexDirection'];
  $display?: CSSProperties['display'];
  $effect?: 'show' | 'hide';
  $flex?: boolean;
  $gap?: CSSProperties['gap'];
  $hasTransition?: boolean;
  $height?: CSSProperties['height'];
  $justify?: CSSProperties['justifyContent'];
  $overflow?: CSSProperties['overflow'];
  $margin?: MarginPadding;
  $maxWidth?: CSSProperties['maxWidth'];
  $minWidth?: CSSProperties['minWidth'];
  $padding?: MarginPadding;
  $position?: CSSProperties['position'];
  $radius?: CSSProperties['borderRadius'];
  $transition?: CSSProperties['transition'];
  $width?: CSSProperties['width'];
}

export type BoxType = ComponentPropsWithRef<typeof Box>;

export const Box = styled('div')<BoxProps>`
  display: flex;
  flex-direction: column;
  ${({ $align }) => $align && `align-items: ${$align};`}
  ${({ $background }) => $background && `background: ${$background};`}
  ${({ $color }) => $color && `color: ${$color};`}
  ${({ $direction }) => $direction && `flex-direction: ${$direction};`}
  ${({ $display }) => $display && `display: ${$display};`}
  ${({ $flex }) => $flex === false && `display: block;`}
  ${({ $gap }) => $gap && `gap: ${$gap};`}
  ${({ $height }) => $height && `height: ${$height};`}
  ${({ $hasTransition }) =>
    $hasTransition && `transition: all 0.3s ease-in-out;`}
  ${({ $justify }) => $justify && `justify-content: ${$justify};`}
  ${({ $margin }) => $margin && stylesMargin($margin)}
  ${({ $maxWidth }) => $maxWidth && `max-width: ${$maxWidth};`}
  ${({ $minWidth }) => $minWidth && `min-width: ${$minWidth};`}
  ${({ $overflow }) => $overflow && `overflow: ${$overflow};`}
  ${({ $padding }) => $padding && stylesPadding($padding)}
  ${({ $position }) => $position && `position: ${$position};`}
  ${({ $radius }) => $radius && `border-radius: ${$radius};`}
  ${({ $transition }) => $transition && `transition: ${$transition};`}
  ${({ $width }) => $width && `width: ${$width};`}
  ${({ $css }) => $css && `${$css};`}
  ${({ $effect }) => {
    let effect;
    switch ($effect) {
      case 'show':
        effect = showEffect;
        break;
      case 'hide':
        effect = hideEffect;
        break;
    }

    return (
      effect &&
      ` 
        transition: all 0.3s ease-in-out;
        ${effect}
      `
    );
  }}
`;
