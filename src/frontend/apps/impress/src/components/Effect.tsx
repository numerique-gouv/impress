import { css, keyframes } from 'styled-components';

const show = keyframes`
 0% { transform: scaleY(0); opacity: 0; max-height: 0; }
 100% { transform: scaleY(1); opacity: 1; max-height: 150px;}
`;

const hide = keyframes`
 0% { transform: scaleY(1); opacity: 1; max-height: 150px;}
 100% { display:none; transform: scaleY(0); opacity: 0; max-height: 0;  }
`;

export const showEffect = css`
  animation: ${show} 0.3s ease-in-out;
`;

export const hideEffect = css`
  animation: ${hide} 0.3s ease-in-out;
  animation-fill-mode: forwards;
`;
