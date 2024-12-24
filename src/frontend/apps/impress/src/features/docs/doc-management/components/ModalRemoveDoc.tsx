import {
  Button,
  Modal,
  ModalSize,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { t } from 'i18next';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/router';

import { Box, Text, TextErrors } from '@/components';

import { useRemoveDoc } from '../api/useRemoveDoc';
import { Doc } from '../types';

interface ModalRemoveDocProps {
  onClose: () => void;
  doc: Doc;
}

export const ModalRemoveDoc = ({ onClose, doc }: ModalRemoveDocProps) => {
  const { toast } = useToastProvider();
  const { push } = useRouter();
  const pathname = usePathname();

  const {
    mutate: removeDoc,

    isError,
    error,
  } = useRemoveDoc({
    onSuccess: () => {
      toast(t('The document has been deleted.'), VariantType.SUCCESS, {
        duration: 4000,
      });
      if (pathname === '/') {
        onClose();
      } else {
        void push('/');
      }
    },
  });

  return (
    <Modal
      isOpen
      closeOnClickOutside
      hideCloseButton
      onClose={() => onClose()}
      rightActions={
        <>
          <Button
            aria-label={t('Close the modal')}
            color="secondary"
            fullWidth
            onClick={() => onClose()}
          >
            {t('Cancel')}
          </Button>
          <Button
            aria-label={t('Confirm deletion')}
            color="danger"
            fullWidth
            onClick={() =>
              removeDoc({
                docId: doc.id,
              })
            }
          >
            {t('Delete')}
          </Button>
        </>
      }
      size={ModalSize.SMALL}
      title={
        <Text $size="h6" as="h6" $margin={{ all: '0' }} $align="flex-start">
          {t('Delete a doc')}
        </Text>
      }
    >
      <Box
        $margin={{ bottom: 'xl' }}
        aria-label={t('Content modal to delete document')}
      >
        {!isError && (
          <Text $size="sm" $variation="600">
            {t('Are you sure you want to delete the document "{{title}}"?', {
              title: doc.title,
            })}
          </Text>
        )}

        {isError && <TextErrors causes={error.cause} />}
      </Box>
    </Modal>
  );
};
