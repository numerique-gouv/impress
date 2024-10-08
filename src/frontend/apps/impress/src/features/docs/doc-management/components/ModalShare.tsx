import { t } from 'i18next';
import { createGlobalStyle } from 'styled-components';

import { Box, Card, SideModal, Text } from '@/components';
import { InvitationList } from '@/features/docs/members/invitation-list';
import { AddMembers } from '@/features/docs/members/members-add';
import { MemberList } from '@/features/docs/members/members-list';
import { useResponsiveStore } from '@/stores';

import { Doc } from '../types';
import { currentDocRole } from '../utils';

import { DocVisibility } from './DocVisibility';

const ModalShareStyle = createGlobalStyle`
  & .c__modal__scroller{
    background: #FAFAFA;
    padding: 1.5rem .5rem;

    .c__modal__title{
      padding: 0;
      margin: 0;
    }

    .c__modal__close{
      margin-right: 1rem;

      button{
        border-bottom: 1px solid #E0E0E0;
        border-left: 1px solid #E0E0E0;
      }
    }
  }
`;

interface ModalShareProps {
  onClose: () => void;
  doc: Doc;
}

export const ModalShare = ({ onClose, doc }: ModalShareProps) => {
  const { isMobile, isSmallMobile } = useResponsiveStore();
  const width = isSmallMobile ? '100vw' : isMobile ? '90vw' : '70vw';

  return (
    <>
      <ModalShareStyle />
      <SideModal
        isOpen
        closeOnClickOutside
        hideCloseButton={!isSmallMobile}
        onClose={onClose}
        width={width}
        $css="min-width: 320px;max-width: 777px;"
      >
        <Box aria-label={t('Share modal')} $margin={{ bottom: 'small' }}>
          <Box $shrink="0">
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
            <DocVisibility doc={doc} />
            {doc.abilities.manage_accesses && (
              <AddMembers
                doc={doc}
                currentRole={currentDocRole(doc.abilities)}
              />
            )}
          </Box>
          <Box $minHeight="0">
            <InvitationList doc={doc} />
            <MemberList doc={doc} />
          </Box>
        </Box>
      </SideModal>
    </>
  );
};
