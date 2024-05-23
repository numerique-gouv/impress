import {
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

import { Pad } from '../../pad/types';
import { useRemovePad } from '../api/useRemovePad';
import IconPad from '../assets/icon-pad.svg';
import IconRemove from '../assets/icon-trash.svg';

interface ModalRemovePadProps {
  onClose: () => void;
  pad: Pad;
}

export const ModalRemovePad = ({ onClose, pad }: ModalRemovePadProps) => {
  const { colorsTokens } = useCunninghamTheme();
  const { toast } = useToastProvider();
  const router = useRouter();

  const {
    mutate: removePad,
    isError,
    error,
  } = useRemovePad({
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
            removePad({
              padId: pad.id,
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
            {t('Deleting the document "{{title}}"', { title: pad.title })}
          </Text>
        </Box>
      }
    >
      <Box
        $margin={{ bottom: 'xl' }}
        aria-label={t('Content modal to delete document')}
      >
        <Text as="p" $margin={{ bottom: 'big' }}>
          {t('Are you sure you want to delete the document "{{title}}"?', {
            title: pad.title,
          })}
        </Text>

        {isError && (
          <TextErrors $margin={{ bottom: 'small' }} causes={error.cause} />
        )}

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
          <IconPad
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
          <Text $theme="primary" $weight="bold" $size="l">
            {pad.title}
          </Text>
        </Text>
      </Box>
    </Modal>
  );
};
