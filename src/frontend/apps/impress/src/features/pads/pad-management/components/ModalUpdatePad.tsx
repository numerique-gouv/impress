import {
  Alert,
  Button,
  Modal,
  ModalSize,
  Switch,
  VariantType,
  useToastProvider,
} from '@openfun/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Text } from '@/components';
import useCunninghamTheme from '@/cunningham/useCunninghamTheme';

import { KEY_LIST_PAD, KEY_PAD } from '../api';
import { useUpdatePad } from '../api/useUpdatePad';
import IconEdit from '../assets/icon-edit.svg';
import { Pad } from '../types';

import { InputPadName } from './InputPadName';

interface ModalUpdatePadProps {
  onClose: () => void;
  pad: Pad;
}

export const ModalUpdatePad = ({ onClose, pad }: ModalUpdatePadProps) => {
  const { colorsTokens } = useCunninghamTheme();
  const [title, setTitle] = useState(pad.title);
  const { toast } = useToastProvider();
  const [padPublic, setPadPublic] = useState(pad.is_public);
  const { t } = useTranslation();

  const {
    mutate: updatePad,
    isError,
    isPending,
    error,
  } = useUpdatePad({
    onSuccess: () => {
      toast(t('The document has been updated.'), VariantType.SUCCESS, {
        duration: 4000,
      });
      onClose();
    },
    listInvalideQueries: [KEY_PAD, KEY_LIST_PAD],
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
          aria-label={t('Validate the modification')}
          color="primary"
          fullWidth
          onClick={() =>
            updatePad({
              title,
              id: pad.id,
              is_public: padPublic,
            })
          }
        >
          {t('Validate the modification')}
        </Button>
      }
      size={ModalSize.MEDIUM}
      title={
        <Box $align="center" $gap="1rem">
          <IconEdit width={48} color={colorsTokens()['primary-text']} />
          <Text as="h2" $size="h3" $margin="none">
            {t('Update document "{{documentTitle}}"', {
              documentTitle: pad.title,
            })}
          </Text>
        </Box>
      }
    >
      <Box
        $margin={{ bottom: 'xl' }}
        aria-label={t('Content modal to update the document')}
        $gap="1rem"
      >
        <Alert canClose={false} type={VariantType.INFO}>
          <Text>{t('Enter the new name of the selected document.')}</Text>
        </Alert>

        <Box $gap="1rem">
          <InputPadName
            label={t('Document name')}
            defaultValue={title}
            {...{ error, isError, isPending, setPadName: setTitle }}
          />
          <Switch
            label={t('Is it public ?')}
            labelSide="right"
            defaultChecked={padPublic}
            onChange={() => setPadPublic(!padPublic)}
          />
        </Box>
      </Box>
    </Modal>
  );
};
