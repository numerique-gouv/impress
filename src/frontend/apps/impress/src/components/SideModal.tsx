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

type SideModalProps = SideModalType & Partial<SideModalStyleProps>;

export const SideModal = ({
  children,
  side = 'right',
  width = '35vw',
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
