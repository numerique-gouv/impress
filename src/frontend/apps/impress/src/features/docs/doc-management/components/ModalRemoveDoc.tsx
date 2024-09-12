import {
  Alert,
  Button,
  Modal,
  ModalSize,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { t } from 'i18next';
import { useRouter } from 'next/navigation';

import { Box, Text, TextErrors } from '@/components';
import useCunninghamTheme from '@/cunningham/useCunninghamTheme';

import { useRemoveDoc } from '../api/useRemoveDoc';
import IconDoc from '../assets/icon-doc.svg';
import IconRemove from '../assets/icon-trash.svg';
import { Doc } from '../types';

interface ModalRemoveDocProps {
  onClose: () => void;
  doc: Doc;
}

export const ModalRemoveDoc = ({ onClose, doc }: ModalRemoveDocProps) => {
  const { colorsTokens } = useCunninghamTheme();
  const { toast } = useToastProvider();
  const router = useRouter();

  const {
    mutate: removeDoc,
    isError,
    error,
  } = useRemoveDoc({
    onSuccess: () => {
      toast(t('The document has been deleted.'), VariantType.SUCCESS, {
        duration: 4000,
      });
      router.push('/');
    },
  });

  return (
    <Modal
      isOpen
      closeOnClickOutside
      hideCloseButton
      leftActions={
        <Button
          aria-label={t('Close the modal')}
          color="secondary"
          fullWidth
          onClick={() => onClose()}
        >
          {t('Cancel')}
        </Button>
      }
      onClose={() => onClose()}
      rightActions={
        <Button
          aria-label={t('Confirm deletion')}
          color="primary"
          fullWidth
          onClick={() =>
            removeDoc({
              docId: doc.id,
            })
          }
        >
          {t('Confirm deletion')}
        </Button>
      }
      size={ModalSize.MEDIUM}
      title={
        <Box $align="center" $gap="1rem">
          <IconRemove width={48} color={colorsTokens()['primary-text']} />
          <Text as="h2" $size="h3" $margin="none">
            {t('Deleting the document "{{title}}"', { title: doc.title })}
          </Text>
        </Box>
      }
    >
      <Box
        $margin={{ bottom: 'xl' }}
        aria-label={t('Content modal to delete document')}
      >
        {!isError && (
          <Alert canClose={false} type={VariantType.WARNING}>
            <Text>
              {t('Are you sure you want to delete the document "{{title}}"?', {
                title: doc.title,
              })}
            </Text>
          </Alert>
        )}

        {isError && <TextErrors causes={error.cause} />}

        <Text
          as="p"
          $padding="small"
          $direction="row"
          $gap="0.5rem"
          $background={colorsTokens()['primary-150']}
          $theme="primary"
          $align="center"
          $radius="2px"
        >
          <IconDoc
            className="p-t"
            aria-label={t(`Document icon`)}
            color={colorsTokens()['primary-500']}
            width={58}
            style={{
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: `1px solid ${colorsTokens()['primary-300']}`,
            }}
          />
          <Text $theme="greyscale" $variation="900" $weight="bold" $size="l">
            {doc.title}
          </Text>
        </Text>
      </Box>
    </Modal>
  );
};
