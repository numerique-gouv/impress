import { CSSProperties, ComponentPropsWithRef, ReactHTML } from 'react';
import styled from 'styled-components';

import { tokens } from '@/cunningham';

import { Box, BoxProps } from './Box';

const { sizes } = tokens.themes.default.theme.font;
type TextSizes = keyof typeof sizes;

export interface TextProps extends BoxProps {
  as?: keyof Pick<
    ReactHTML,
    'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  >;
  $weight?: CSSProperties['fontWeight'];
  $textAlign?: CSSProperties['textAlign'];
  // eslint-disable-next-line @typescript-eslint/ban-types
  $size?: TextSizes | (string & {});
  $theme?:
    | 'primary'
    | 'secondary'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'greyscale';
  $variation?:
    | 'text'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';
}

export type TextType = ComponentPropsWithRef<typeof Text>;

export const TextStyled = styled(Box)<TextProps>`
  ${({ $textAlign }) => $textAlign && `text-align: ${$textAlign};`}
  ${({ $weight }) => $weight && `font-weight: ${$weight};`}
  ${({ $size }) =>
    $size &&
    `font-size: ${$size in sizes ? sizes[$size as TextSizes] : $size};`}
  ${({ $theme, $variation }) =>
    `color: var(--c--theme--colors--${$theme}-${$variation});`}
  ${({ $color }) => $color && `color: ${$color};`}
`;

export const Text = ({
  ...props
}: ComponentPropsWithRef<typeof TextStyled>) => {
  return (
    <TextStyled as="span" $theme="greyscale" $variation="text" {...props} />
  );
};
