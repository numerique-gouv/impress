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

import { KEY_DOC, KEY_LIST_DOC } from '../api';
import { useUpdateDoc } from '../api/useUpdateDoc';
import IconEdit from '../assets/icon-edit.svg';
import { Doc } from '../types';

import { InputDocName } from './InputDocName';

interface ModalUpdateDocProps {
  onClose: () => void;
  doc: Doc;
}

export const ModalUpdateDoc = ({ onClose, doc }: ModalUpdateDocProps) => {
  const { colorsTokens } = useCunninghamTheme();
  const [title, setTitle] = useState(doc.title);
  const { toast } = useToastProvider();
  const [docPublic, setDocPublic] = useState(doc.is_public);
  const { t } = useTranslation();

  const {
    mutate: updateDoc,
    isError,
    isPending,
    error,
  } = useUpdateDoc({
    onSuccess: () => {
      toast(t('The document has been updated.'), VariantType.SUCCESS, {
        duration: 4000,
      });
      onClose();
    },
    listInvalideQueries: [KEY_DOC, KEY_LIST_DOC],
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
            updateDoc({
              title,
              id: doc.id,
              is_public: docPublic,
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
              documentTitle: doc.title,
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
          <InputDocName
            label={t('Document name')}
            defaultValue={title}
            {...{ error, isError, isPending, setDocName: setTitle }}
          />
          <Switch
            label={t('Is it public ?')}
            labelSide="right"
            defaultChecked={docPublic}
            onChange={() => setDocPublic(!docPublic)}
          />
        </Box>
      </Box>
    </Modal>
  );
};
