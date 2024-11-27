import { css } from 'styled-components';

import { Box } from './Box';

type Props = {
  size?: 'small' | 'medium' | 'large';
};
export const SimpleLoader = ({ size = 'medium' }: Props) => {
  return (
    <Box
      className={size}
      $css={css`
        display: inline-block;
        border: 3px solid var(--c--theme--colors--primary-300);
        border-radius: 50%;
        border-top-color: var(--c--theme--colors--primary-600);
        animation: spin 1s ease-in-out infinite;
        -webkit-animation: spin 1s ease-in-out infinite;

        &.small {
          width: 24px;
          height: 24px;
        }

        &.medium {
          width: 38px;
          height: 38px;
        }

        &.large {
          width: 50px;
          height: 50px;
        }

        @keyframes spin {
          to {
            -webkit-transform: rotate(360deg);
          }
        }
        @-webkit-keyframes spin {
          to {
            -webkit-transform: rotate(360deg);
          }
        }
      `}
    />
  );
};
