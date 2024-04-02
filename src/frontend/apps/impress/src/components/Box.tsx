import { ComponentPropsWithRef, ReactHTML } from 'react';
import styled from 'styled-components';
import { CSSProperties } from 'styled-components/dist/types';

export interface BoxProps {
  as?: keyof ReactHTML;
  $align?: CSSProperties['alignItems'];
  $background?: CSSProperties['background'];
  $color?: CSSProperties['color'];
  $css?: string;
  $direction?: CSSProperties['flexDirection'];
  $display?: CSSProperties['display'];
  $flex?: boolean;
  $gap?: CSSProperties['gap'];
  $height?: CSSProperties['height'];
  $justify?: CSSProperties['justifyContent'];
  $overflow?: CSSProperties['overflow'];
  $position?: CSSProperties['position'];
  $radius?: CSSProperties['borderRadius'];
  $width?: CSSProperties['width'];
  $maxWidth?: CSSProperties['maxWidth'];
  $minWidth?: CSSProperties['minWidth'];
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
  ${({ $justify }) => $justify && `justify-content: ${$justify};`}
  ${({ $overflow }) => $overflow && `overflow: ${$overflow};`}
  ${({ $position }) => $position && `position: ${$position};`}
  ${({ $radius }) => $radius && `border-radius: ${$radius};`}
  ${({ $width }) => $width && `width: ${$width};`}
  ${({ $maxWidth }) => $maxWidth && `max-width: ${$maxWidth};`}
  ${({ $minWidth }) => $minWidth && `min-width: ${$minWidth};`}
  ${({ $css }) => $css && `${$css};`}
`;
