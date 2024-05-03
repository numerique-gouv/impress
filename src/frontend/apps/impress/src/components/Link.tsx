import Link from 'next/link';
import styled from 'styled-components';

export interface LinkProps {
  $css?: string;
}

export const StyledLink = styled(Link)<LinkProps>`
  text-decoration: none;
  color: #ffffff33;
  &[aria-current='page'] {
    color: #ffffff;
  }
  display: flex;
  ${({ $css }) => $css && `${$css};`}
`;
