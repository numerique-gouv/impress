import { Modal, ModalSize } from '@openfun/cunningham-react';
import { ComponentPropsWithRef, PropsWithChildren } from 'react';
import { createGlobalStyle } from 'styled-components';

interface SideModalStyleProps {
  side: 'left' | 'right';
  width: string;
}

const SideModalStyle = createGlobalStyle<SideModalStyleProps>`
  & .c__modal{
    width: ${({ width }) => width};
    ${({ side }) => side === 'right' && 'left: auto;'};
    
    .c__modal__scroller {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
  }
`;

type SideModalType = Omit<ComponentPropsWithRef<typeof Modal>, 'size'>;

interface SideModalProps extends SideModalType {
  side: 'left' | 'right';
  width: string;
}

export const SideModal = ({
  children,
  side,
  width,
  ...modalProps
}: PropsWithChildren<SideModalProps>) => {
  return (
    <>
      <SideModalStyle width={width} side={side} />
      <Modal {...modalProps} size={ModalSize.FULL}>
        {children}
      </Modal>
    </>
  );
};
