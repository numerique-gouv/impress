import Link from 'next/link';
import styled from 'styled-components';

export const StyledLink = styled(Link)`
  text-decoration: none;
  color: #ffffff33;
  &[aria-current='page'] {
    color: #ffffff;
  }
  display: flex;
`;
