import { Modal, ModalSize } from '@openfun/cunningham-react';
import { useTranslation } from 'react-i18next';
import { createGlobalStyle } from 'styled-components';

import { Box, Text } from '@/components';
import { Doc } from '@/features/docs/doc-management';

import { MemberGrid } from './MemberGrid';

const GlobalStyle = createGlobalStyle`
  .c__modal {
    overflow: visible;
  }
`;

interface ModalGridMembersProps {
  onClose: () => void;
  doc: Doc;
}

export const ModalGridMembers = ({ doc, onClose }: ModalGridMembersProps) => {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen
      onClose={onClose}
      closeOnClickOutside
      size={ModalSize.LARGE}
      title={
        <Box $align="center" $gap="1rem">
          <Text className="material-icons" $size="3.5rem" $theme="primary">
            group
          </Text>
          <Text $size="h3" $margin="none">
            {t('Members of the document')}
          </Text>
        </Box>
      }
    >
      <GlobalStyle />
      <Box $margin={{ top: 'large' }} $maxHeight="60vh">
        <MemberGrid doc={doc} />
      </Box>
    </Modal>
  );
};
