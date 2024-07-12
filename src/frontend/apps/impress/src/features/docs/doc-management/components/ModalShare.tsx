import { t } from 'i18next';
import { useEffect } from 'react';
import { createGlobalStyle } from 'styled-components';

import { Box, Card, Text } from '@/components';
import { SideModal } from '@/components/SideModal';

import { AddMembers } from '../../members/members-add';
import { MemberList } from '../../members/members-list/components/MemberList';
import { Doc } from '../types';
import { currentDocRole } from '../utils';

const ModalShareStyle = createGlobalStyle`
  & .c__modal__scroller{
    background: #FAFAFA;
    padding: 1.5rem .5rem;

    .c__modal__title{
      padding: 0;
      margin: 0;
    }
  }
`;

interface ModalShareProps {
  onClose: () => void;
  doc: Doc;
}

export const ModalShare = ({ onClose, doc }: ModalShareProps) => {
  useEffect(() => {
    if (!doc.abilities.manage_accesses) {
      onClose();
    }
  }, [doc.abilities.manage_accesses, onClose]);

  return (
    <>
      <ModalShareStyle />
      <SideModal
        isOpen
        closeOnClickOutside
        hideCloseButton
        onClose={onClose}
        width="70vw"
        $css="min-width: 320px;max-width: 777px;"
        title={
          <Card
            $direction="row"
            $align="center"
            $margin={{ horizontal: 'tiny', top: 'none', bottom: 'big' }}
            $padding="tiny"
            $gap="1rem"
          >
            <Text $isMaterialIcon $size="48px" $theme="primary">
              share
            </Text>
            <Box $align="flex-start">
              <Text as="h3" $size="26px" $margin="none">
                {t('Share')}
              </Text>
              <Text $size="small" $weight="normal" $textAlign="left">
                {doc.title}
              </Text>
            </Box>
          </Card>
        }
      >
        <AddMembers doc={doc} currentRole={currentDocRole(doc.abilities)} />
        <MemberList doc={doc} />
      </SideModal>
    </>
  );
};
